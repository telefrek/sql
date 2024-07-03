import type { ColumnReference } from "../../ast/columns.js"
import type { SelectClause } from "../../ast/select.js"
import type { Flatten, Invalid } from "../../type-utils/common.js"
import type { ParseColumnReference } from "./columns.js"
import type { FromKeywords } from "./keywords.js"
import type {
  ExtractUntil,
  NextToken,
  SplitSQL,
  StartsWith,
} from "./normalize.js"
import type { ParseTableReference } from "./table.js"

/**
 * Parse the next select statement from the string
 */
export type ParseSelect<T> = NextToken<T> extends ["SELECT", infer Right]
  ? CheckSelect<ExtractColumns<Right>>
  : never

/**
 * Check to get the type information
 */
type CheckSelect<T> = Flatten<T> extends Partial<
  SelectClause<infer Columns, infer From>
>
  ? Flatten<SelectClause<Columns, From>>
  : Invalid<"Not a valid SELECT statement">

/**
 * Parse out the columns and then process any from information
 */
type ExtractColumns<T> = ExtractUntil<T, "FROM"> extends [
  infer Columns,
  infer From
]
  ? StartsWith<From, "FROM"> extends true
    ? Columns extends "*"
      ? {
          columns: Columns
        } & ExtractFrom<From>
      : {
          columns: ParseColumns<SplitSQL<Columns>>
        } & ExtractFrom<From>
    : never
  : never

/**
 * Parse the columns that were extracted
 */
type ParseColumns<T, O = object> = T extends [
  infer Column extends string,
  ...infer Rest
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
type ExtractFrom<T> = NextToken<T> extends [
  infer _,
  infer Clause extends string
]
  ? ExtractUntil<Clause, FromKeywords> extends [
      infer From extends string,
      infer _
    ]
    ? Flatten<{
        from: ParseTableReference<From>
      }>
    : {
        from: ParseTableReference<Clause>
      }
  : never
