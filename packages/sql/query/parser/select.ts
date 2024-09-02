import type { Flatten, Invalid } from "@telefrek/type-utils/common.js"
import type { Trim } from "@telefrek/type-utils/strings"
import type { NamedQuery } from "../../ast/named.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { WhereClause } from "../../ast/where.js"
import { parseSelectedColumns, type ParseSelectedColumns } from "./columns.js"
import type { PartialParserResult } from "./common.js"
import { takeUntil, type SplitSQL } from "./normalize.js"
import type { ParserOptions } from "./options.js"
import { tryParseNamedQuery } from "./query.js"
import { parseTableReference, type ParseTableReference } from "./table.js"
import { parseWhere, type ExtractWhere } from "./where.js"

/**
 * Parse the next select statement from the string
 */
export type ParseSelect<
  SelectSQL extends string,
  Options extends ParserOptions
> = SelectSQL extends `SELECT ${infer Remainder}`
  ? VerifySelect<ExtractSelect<Remainder, Options>>
  : Invalid<"Corrupt SELECT syntax">

/**
 * Parse out the given select clause
 *
 * @param tokens The tokens to parse
 * @returns A {@link SelectClause}
 */
export function parseSelectClause(
  tokens: string[],
  options: ParserOptions
): SelectClause {
  // Extract the core select
  let select = {
    columns: parseSelectedColumns(takeUntil(tokens, ["FROM"])),
    ...parseFrom(tokens, options),
  }

  // Parse the optional where clause
  if (tokens.length > 0 && tokens[0] === "WHERE") {
    tokens.shift()
    select = { ...select, ...parseWhere(tokens, options) }
  }

  return {
    type: "SelectClause",
    ...select,
  }
}

/**
 * Parse the tokens into the correct table or subquery object
 *
 * @param tokens The tokens of the from clause
 * @returns A from clause
 */
function parseFrom(
  tokens: string[],
  options: ParserOptions
): {
  from: TableReference | NamedQuery
} {
  // We need to remove the from which is still part of the query
  const check = tokens.shift()
  if (check !== "FROM") {
    throw new Error(
      `Corrupt query segment, expected FROM but received: ${check}`
    )
  }

  // Ensure no truncated token
  if (tokens.length === 0) {
    throw new Error(`Corrupt query segment ended with FROM`)
  }

  // Check for a subquery
  const subquery = tryParseNamedQuery(tokens, options)
  if (subquery !== undefined) {
    return {
      from: subquery,
    }
  }

  // Just parse the table reference
  return {
    from: parseTableReference(tokens, options),
  }
}

/**
 * Check to get the type information
 */
type VerifySelect<T> = T extends Partial<
  SelectClause<infer Columns, infer From>
>
  ? T extends WhereClause<infer Where>
    ? Flatten<SelectClause<Columns, From> & WhereClause<Where>>
    : SelectClause<Columns, From>
  : T

/**
 * Validation for no invalid spaces between columns
 */
type CheckNoSpaces<Column extends string> =
  Column extends `${infer _Begin} ${infer _End}`
    ? Invalid<`Column missing commas: ${Column}`>
    : Column extends ""
    ? Invalid<"Invalid empty column">
    : true

/**
 * Ensure the column reference is valid including the aliasing
 */
type CheckColumnIsValid<T extends string> =
  T extends `${infer Column} AS ${infer Alias}`
    ? CheckNoSpaces<Column> extends true
      ? CheckNoSpaces<Alias> extends true
        ? true
        : CheckNoSpaces<Alias>
      : CheckNoSpaces<Column>
    : CheckNoSpaces<T>

/**
 * Verify that there are columns found and that they are valid
 */
type CheckColumnSyntax<Columns> = Columns extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends never[]
    ? CheckColumnIsValid<Next>
    : CheckColumnIsValid<Next> extends true
    ? CheckColumnSyntax<Rest>
    : CheckColumnIsValid<Next>
  : Invalid<"No columns found">

/**
 * Split by commas and verify no invalid syntax
 */
type CheckColumns<T extends string> = CheckColumnSyntax<SplitSQL<T>>

/** Extract the SelectClause from the back to the front */
type ExtractSelect<
  SelectSQL extends string,
  Options extends ParserOptions
> = ExtractWhere<
  PartialParserResult<SelectSQL>,
  Options
> extends PartialParserResult<infer SQL, infer Returning>
  ? ExtractFrom<PartialParserResult<SQL, Returning>, Options>
  : ExtractWhere<PartialParserResult<SelectSQL>, Options>

/** Extract the from clause */
type ExtractFrom<
  Current extends PartialParserResult,
  Options extends ParserOptions
> = Current extends PartialParserResult<infer SQL, infer Result>
  ? SQL extends `${infer Columns}FROM ${infer FromClause}`
    ? ExtractColumns<
        PartialParserResult<
          Trim<Columns>,
          Flatten<Result & { from: ParseTableReference<FromClause, Options> }>
        >,
        Options
      >
    : Invalid<`Missing FROM clause`>
  : never

/** Extract the selected columns */
type ExtractColumns<
  Current extends PartialParserResult,
  Options extends ParserOptions
> = Current extends PartialParserResult<infer Columns, infer Returning>
  ? CheckColumns<Columns> extends true
    ? Flatten<Returning & { columns: ParseSelectedColumns<Columns, Options> }>
    : CheckColumns<Columns>
  : never
