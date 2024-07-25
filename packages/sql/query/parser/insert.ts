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
import { parseQueryClause } from "./query.js"
import type { ParseSelect } from "./select.js"
import { parseTableReference, type ParseTableReference } from "./table.js"
import { tryParseReturning, type ParseReturning } from "./utils.js"
import { parseValue, type CheckValueType, type ExtractValue } from "./values.js"

export type ParseInsert<T extends string> =
  T extends `INSERT INTO ${infer Remainder}`
    ? CheckReturning<Remainder> extends infer I extends object
      ? CheckInsert<I>
      : CheckReturning<Remainder>
    : Invalid<"Corrupt INSERT INTO syntax">

type CheckInsert<T> = T extends Partial<
  InsertClause<infer Table, infer Columns, infer Values>
>
  ? T extends ReturningClause<infer Returning>
    ? Flatten<InsertClause<Table, Columns, Values> & ReturningClause<Returning>>
    : InsertClause<Table, Columns, Values>
  : T

// Retrive the returning portion
type CheckReturning<T extends string> =
  T extends `${infer Previous} RETURNING ${infer Returning}`
    ? ParseReturning<`RETURNING ${Returning}`> extends infer R extends object
      ? CheckValues<[R, Previous]>
      : ParseReturning<`RETURNING ${Returning}`>
    : CheckValues<[IgnoreEmpty, T]>

type CheckValues<Current> = Current extends [
  infer Returning extends object,
  infer Remainder extends string
]
  ? Remainder extends `${infer Previous} VALUES ( ${infer Values} )`
    ? ExtractValuesArray<Values> extends infer V extends ValueTypes[]
      ? CheckColumns<[Flatten<Returning & { values: V }>, Previous]>
      : ExtractValuesArray<Values>
    : Remainder extends `${infer Previous} SELECT ${infer Select}`
    ? ParseSelect<Select> extends infer S extends SelectClause
      ? CheckColumns<[Flatten<Returning & { values: NamedQuery<S> }>, Previous]>
      : ParseSelect<Select>
    : Invalid<`VALUES or SELECT are required for INSERT: ${Remainder}`>
  : Current

type CheckColumns<Current> = Current extends [
  infer Returning extends object,
  infer Remainder extends string
]
  ? Remainder extends `${infer Previous} ( ${infer Columns} )`
    ? ParseSelectedColumns<Columns> extends infer C extends SelectColumns | "*"
      ? CheckTable<[Flatten<Returning & { columns: C }>, Previous]>
      : ParseSelectedColumns<Columns>
    : CheckTable<[Flatten<Returning & { columns: [] }>, Remainder]>
  : Current

type CheckTable<Current> = Current extends [
  infer Returning extends object,
  infer Remainder extends string
]
  ? ParseTableReference<Remainder> extends TableReference<infer T>
    ? Flatten<
        {
          table: TableReference<T>
        } & Returning
      >
    : ParseTableReference<Remainder>
  : Current

/**
 * Extract the values
 */
type ExtractValuesArray<T extends string> = ExtractValueArr<
  SplitSQL<T>
> extends infer V extends ValueTypes[]
  ? V
  : Invalid<"Failed to extract values">

type ExtractValueArr<Values> = Values extends [
  infer NextValue extends string,
  ...infer Rest
]
  ? ExtractValue<NextValue> extends [infer V extends string]
    ? Rest extends never[]
      ? [CheckValueType<V>]
      : [CheckValueType<V>, ...ExtractValueArr<Rest>]
    : never
  : never

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
