import type { Flatten, IgnoreEmpty, Invalid } from "@telefrek/type-utils/common"
import type { ColumnReference } from "../../ast/columns.js"
import type { NamedQuery } from "../../ast/named.js"
import type {
  InsertClause,
  ReturningClause,
  RowGeneratingClause,
} from "../../ast/queries.js"
import type { SelectClause, SelectColumns } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { ValueTypes } from "../../ast/values.js"
import { parseColumnReference, type ParseSelectedColumns } from "./columns.js"
import { extractParenthesis, type SplitSQL } from "./normalize.js"
import type { ParserOptions } from "./options.js"
import { parseQueryClause } from "./query.js"
import type { ParseSelect } from "./select.js"
import { parseTableReference, type ParseTableReference } from "./table.js"
import { tryParseReturning, type ParseReturning } from "./utils.js"
import { parseValue, type ExtractValues } from "./values.js"

export type ParseInsert<
  InsertSQL extends string,
  Options extends ParserOptions
> = InsertSQL extends `INSERT INTO ${infer Remainder}`
  ? CheckInsert<CheckReturning<Remainder, Options>>
  : Invalid<"Corrupt INSERT INTO syntax">

type CheckInsert<T> = T extends Partial<
  InsertClause<infer Table, infer Columns, infer Values>
>
  ? T extends ReturningClause<infer Returning>
    ? Flatten<InsertClause<Table, Columns, Values> & ReturningClause<Returning>>
    : InsertClause<Table, Columns, Values>
  : T

// Retrive the returning portion
type CheckReturning<
  InsertSQL extends string,
  Options extends ParserOptions
> = InsertSQL extends `${infer Previous} RETURNING ${infer Returning}`
  ? ParseReturning<
      `RETURNING ${Returning}`,
      Options
    > extends infer R extends object
    ? CheckValues<[R, Previous], Options>
    : ParseReturning<`RETURNING ${Returning}`, Options>
  : CheckValues<[IgnoreEmpty, InsertSQL], Options>

type CheckValues<Current, Options extends ParserOptions> = Current extends [
  infer Returning extends object,
  infer Remainder extends string
]
  ? Remainder extends `${infer Previous} VALUES ( ${infer Values} )`
    ? ExtractValuesArray<Values, Options> extends infer V extends ValueTypes[]
      ? CheckColumns<[Flatten<Returning & { values: V }>, Previous], Options>
      : ExtractValuesArray<Values, Options>
    : Remainder extends `${infer Previous} SELECT ${infer Select}`
    ? ParseSelect<Select, Options> extends infer S extends SelectClause
      ? CheckColumns<
          [Flatten<Returning & { values: NamedQuery<S> }>, Previous],
          Options
        >
      : ParseSelect<Select, Options>
    : Invalid<`VALUES or SELECT are required for INSERT: ${Remainder}`>
  : Current

type CheckColumns<Current, Options extends ParserOptions> = Current extends [
  infer Returning extends object,
  infer Remainder extends string
]
  ? Remainder extends `${infer Previous} ( ${infer Columns} )`
    ? ParseSelectedColumns<Columns, Options> extends infer C extends
        | SelectColumns
        | "*"
      ? CheckTable<[Flatten<Returning & { columns: C }>, Previous], Options>
      : ParseSelectedColumns<Columns, Options>
    : CheckTable<[Flatten<Returning & { columns: [] }>, Remainder], Options>
  : Current

type CheckTable<Current, Options extends ParserOptions> = Current extends [
  infer Returning extends object,
  infer Remainder extends string
]
  ? ParseTableReference<Remainder, Options> extends TableReference<infer T>
    ? Flatten<
        {
          table: TableReference<T>
        } & Returning
      >
    : ParseTableReference<Remainder, Options>
  : Current

/**
 * Extract the values
 */
type ExtractValuesArray<
  T extends string,
  Options extends ParserOptions
> = ExtractValues<SplitSQL<T>, Options> extends infer V extends ValueTypes[]
  ? V
  : Invalid<"Failed to extract values">

export function parseInsertClause(
  tokens: string[]
): InsertClause & Partial<ReturningClause> {
  // Parse the table reference first
  const table = parseTableReference(tokens)

  // Extract the columns if they are specified
  const columns = parseColumns(tokens)

  // Parse the values or starting clause
  const values = parseValuesOrSelect(tokens)

  return {
    type: "InsertClause",
    table,
    columns,
    values,
    ...tryParseReturning(tokens),
  }
}

function parseColumns(tokens: string[]): ColumnReference[] {
  if (tokens.length > 0 && tokens[0] === "(") {
    return extractParenthesis(tokens)
      .join(" ")
      .split(" , ")
      .map((c) => parseColumnReference(c.split(" ")))
  }

  return []
}

function parseValuesOrSelect(
  tokens: string[]
): ValueTypes[] | RowGeneratingClause {
  if (tokens[0] === "VALUES") {
    return extractParenthesis(tokens.slice(1))
      .join(" ")
      .split(" , ")
      .map((v) => parseValue(v.trim())) as ValueTypes[]
  }

  const subquery = parseQueryClause(tokens)
  if (subquery.type === "SelectClause") {
    return subquery
  }

  throw new Error(`Unsupported subquery type: ${subquery.type}`)
}
