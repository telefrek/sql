import type { Flatten, Invalid } from "@telefrek/type-utils/common"
import type { ColumnReference } from "../../ast/columns.js"
import type {
  InsertClause,
  ReturningClause,
  RowGeneratingClause,
} from "../../ast/queries.js"
import type { SelectClause, SelectColumns } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { ValueTypes } from "../../ast/values.js"
import { parseColumnReference, type ParseSelectedColumns } from "./columns.js"
import type { PartialParserResult } from "./common.js"
import { extractParenthesis } from "./normalize.js"
import type { ParserOptions } from "./options.js"
import { parseQueryClause } from "./query.js"
import type { ExtractReturning } from "./returning.js"
import type { ParseSelect } from "./select.js"
import { parseTableReference, type ParseTableReference } from "./table.js"
import { tryParseReturning } from "./utils.js"
import { parseValue, type ParseValues } from "./values.js"

/**
 * Parse an insert clause
 */
export type ParseInsert<
  InsertSQL extends string,
  Options extends ParserOptions
> = InsertSQL extends `INSERT INTO ${infer Remainder}`
  ? VerifyInsert<ExtractInsert<Remainder, Options>>
  : Invalid<"Corrupt INSERT INTO syntax">

/**
 * Verify the insert is well formed
 */
type VerifyInsert<T> = T extends Partial<
  InsertClause<infer Table, infer Columns, infer Values>
>
  ? T extends ReturningClause<infer Returning>
    ? Flatten<InsertClause<Table, Columns, Values> & ReturningClause<Returning>>
    : InsertClause<Table, Columns, Values>
  : T

/**
 * Extract the insert clause
 */
type ExtractInsert<
  InsertSQL extends string,
  Options extends ParserOptions
> = ExtractReturning<InsertSQL, Options> extends PartialParserResult<
  infer SQL extends string,
  infer Returning
>
  ? Returning extends ReturningClause
    ? ExtractInsertValues<PartialParserResult<SQL, Returning>, Options>
    : ExtractInsertValues<PartialParserResult<SQL>, Options>
  : ExtractReturning<InsertSQL, Options>

/**
 * Extract the values portion of the insert
 */
type ExtractInsertValues<
  Current extends PartialParserResult,
  Options extends ParserOptions
> = Current extends PartialParserResult<
  infer SQL extends string,
  infer Result extends object
>
  ? SQL extends `${infer Columns} VALUES ( ${infer ValuesClause} )`
    ? ParseValues<
        ValuesClause,
        Options
      > extends infer Values extends ValueTypes[]
      ? ExtractInsertColumns<
          PartialParserResult<Columns, Flatten<Result & { values: Values }>>,
          Options
        >
      : ParseValues<ValuesClause, Options>
    : SQL extends `${infer Columns} SELECT ${infer Select}`
    ? ParseSelect<Select, Options> extends infer S extends SelectClause
      ? ExtractInsertColumns<
          PartialParserResult<Columns, Flatten<Result & { values: S }>>,
          Options
        >
      : ParseSelect<Select, Options>
    : Invalid<`VALUES or SELECT are required for INSERT`>
  : never

/**
 * Extract the columns portion of an insert
 */
type ExtractInsertColumns<
  Current extends PartialParserResult,
  Options extends ParserOptions
> = Current extends PartialParserResult<
  infer SQL extends string,
  infer Result extends object
>
  ? SQL extends `${infer Table} ( ${infer ColumnsClause} )`
    ? ParseSelectedColumns<
        ColumnsClause,
        Options
      > extends infer Columns extends SelectColumns | "*"
      ? ExtractInsertTable<
          PartialParserResult<Table, Flatten<Result & { columns: Columns }>>,
          Options
        >
      : ParseSelectedColumns<ColumnsClause, Options>
    : SQL extends `${infer _}( ${infer _} )`
    ? Invalid<"Table is required for INSERT">
    : ExtractInsertTable<
        PartialParserResult<SQL, Flatten<Result & { columns: [] }>>,
        Options
      >
  : never

/**
 * Extract the table portion of an insert
 */
type ExtractInsertTable<
  Current extends PartialParserResult,
  Options extends ParserOptions
> = Current extends PartialParserResult<
  infer SQL extends string,
  infer Result extends object
>
  ? ParseTableReference<SQL, Options> extends TableReference<
      infer Table,
      infer Alias
    >
    ? Flatten<Result & { table: TableReference<Table, Alias> }>
    : ParseTableReference<SQL, Options>
  : never

/**
 * Parse a new {@link InsertClause} from the stack
 *
 * @param tokens The current token stack
 * @param options The current parser options
 * @returns A parsed insert clause
 */
export function parseInsertClause(
  tokens: string[],
  options: ParserOptions
): InsertClause & Partial<ReturningClause> {
  if (tokens.shift() !== "INTO") {
    throw new Error("Insert must start with INSERT INTO")
  }

  // Parse the table reference first
  const table = parseTableReference(tokens, options)

  // Extract the columns if they are specified
  const columns = parseColumns(tokens)

  // Parse the values or starting clause
  const values = parseValuesOrSelect(tokens, options)

  return {
    type: "InsertClause",
    table,
    columns,
    values,
    ...tryParseReturning(tokens),
  }
}

/**
 * Extract the parsed columns
 *
 * @param tokens The current stack
 * @returns The columns that were parsed
 */
function parseColumns(tokens: string[]): ColumnReference[] {
  if (tokens.length > 0 && tokens[0] === "(") {
    return extractParenthesis(tokens)
      .join(" ")
      .split(" , ")
      .map((c) => parseColumnReference(c.split(" ")))
  }

  return []
}

/**
 * Parse the values or select clause
 *
 * @param tokens The current stack
 * @param options The current options
 * @returns A values object for the insert clause
 */
function parseValuesOrSelect(
  tokens: string[],
  options: ParserOptions
): ValueTypes[] | RowGeneratingClause {
  if (tokens[0] === "VALUES") {
    tokens.shift()
    return extractParenthesis(tokens)
      .join(" ")
      .split(" , ")
      .map((v) => parseValue(v.trim())) as ValueTypes[]
  }

  const subquery = parseQueryClause(tokens, options)
  if (subquery.type === "SelectClause") {
    return subquery
  }

  throw new Error(`Unsupported subquery type: ${subquery.type}`)
}
