import type { Flatten, Invalid } from "@telefrek/type-utils/common.js"
import type { ColumnReference } from "../../ast/columns.js"
import type { SelectClause } from "../../ast/select.js"
import { parseSelectedColumns, type ParseColumnReference } from "./columns.js"
import { FROM_KEYS, type FromKeywords } from "./keywords.js"
import {
  takeUntil,
  type ExtractUntil,
  type NextToken,
  type SplitSQL,
  type StartsWith,
} from "./normalize.js"
import { parseFrom, type ParseTableReference } from "./table.js"

/**
 * Parse the next select statement from the string
 */
export type ParseSelect<T> =
  NextToken<T> extends ["SELECT", infer Right extends string]
    ? CheckSelect<ExtractColumns<Right>>
    : never

/**
 * Parse out the given select clause
 *
 * @param tokens The tokens to parse
 * @returns A {@link SelectClause}
 */
export function parseSelectClause(tokens: string[]): SelectClause {
  return {
    type: "SelectClause",
    ...parseSelectedColumns(takeUntil(tokens, ["FROM"])),
    ...parseFrom(takeUntil(tokens, FROM_KEYS)),
  }
}

/**
 * Check to get the type information
 */
type CheckSelect<T> =
  Flatten<T> extends Partial<SelectClause<infer Columns, infer From>>
    ? Flatten<SelectClause<Columns, From>>
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
  ...infer Rest,
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
type ExtractColumns<T extends string> =
  ExtractUntil<T, "FROM"> extends [
    infer Columns extends string,
    infer From extends string,
  ]
    ? CheckColumns<Columns> extends true
      ? StartsWith<From, "FROM"> extends true
        ? Columns extends "*"
          ? {
              columns: Columns
            } & ExtractFrom<From>
          : {
              columns: ParseColumns<SplitSQL<Columns>>
            } & ExtractFrom<From>
        : Invalid<"Failed to parse columns">
      : CheckColumns<Columns>
    : Invalid<"Missing FROM">

/**
 * Parse the columns that were extracted
 */
type ParseColumns<T, O = object> = T extends [
  infer Column extends string,
  ...infer Rest,
]
  ? Rest extends never[]
    ? ParseColumnReference<Column> extends ColumnReference<infer C, infer A>
      ? Flatten<
          O & {
            [key in A]: ColumnReference<C, A>
          }
        >
      : Invalid<`Invalid column reference`>
    : ParseColumnReference<Column> extends ColumnReference<infer C, infer A>
      ? Flatten<
          ParseColumns<
            Rest,
            Flatten<
              O & {
                [key in A]: ColumnReference<C, A>
              }
            >
          >
        >
      : Invalid<`Invalid column reference`>
  : never

/**
 * Extract the from information
 */
type ExtractFrom<T> =
  NextToken<T> extends [infer _, infer Clause extends string]
    ? ExtractUntil<Clause, FromKeywords> extends [
        infer From extends string,
        infer _,
      ]
      ? Flatten<{
          from: ParseTableReference<From>
        }>
      : {
          from: ParseTableReference<Clause>
        }
    : never
