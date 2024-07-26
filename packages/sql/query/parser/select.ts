import type { Invalid } from "@telefrek/type-utils/common.js"
import type { NamedQuery } from "../../ast/named.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import { parseSelectedColumns, type ParseSelectedColumns } from "./columns.js"
import { FROM_KEYS, type FromKeywords } from "./keywords.js"
import {
  takeUntil,
  type ExtractUntil,
  type NextToken,
  type SplitSQL,
  type StartsWith,
} from "./normalize.js"
import type { ParserOptions } from "./options.js"
import { parseTableReference, type ParseTableReference } from "./table.js"
import { tryParseNamedQuery } from "./utils.js"

/**
 * Parse the next select statement from the string
 */
export type ParseSelect<
  T extends string,
  Options extends ParserOptions
> = NextToken<T> extends ["SELECT", infer Right extends string]
  ? CheckSelect<ExtractColumns<Right, Options>>
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
  return {
    type: "SelectClause",
    columns: parseSelectedColumns(takeUntil(tokens, ["FROM"])),
    ...parseFrom(takeUntil(tokens, FROM_KEYS), options),
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
type CheckSelect<T> = T extends Partial<SelectClause<infer Columns, infer From>>
  ? SelectClause<Columns, From>
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

/**
 * Parse out the columns and then process any from information
 */
type ExtractColumns<
  T extends string,
  Options extends ParserOptions
> = ExtractUntil<T, "FROM"> extends [
  infer Columns extends string,
  infer From extends string
]
  ? CheckColumns<Columns> extends true
    ? StartsWith<From, "FROM"> extends true
      ? {
          columns: ParseSelectedColumns<Columns, Options>
        } & ExtractFrom<From, Options>
      : Invalid<"Failed to parse columns">
    : CheckColumns<Columns>
  : Invalid<"Missing FROM">

/**
 * Extract the from information
 */
type ExtractFrom<
  T extends string,
  Options extends ParserOptions
> = NextToken<T> extends ["FROM", infer Clause extends string]
  ? ExtractUntil<Clause, FromKeywords> extends [
      infer From extends string,
      infer _
    ]
    ? {
        from: ParseTableReference<From, Options>
      }
    : {
        from: ParseTableReference<Clause, Options>
      }
  : never
