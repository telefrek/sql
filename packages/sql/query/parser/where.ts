import type { Flatten, Invalid } from "@telefrek/type-utils/common"
import type { Join, Trim } from "@telefrek/type-utils/strings"
import type { ColumnReference } from "../../ast/columns.js"
import type {
  ColumnFilter,
  ComparisonOperation,
  LogicalExpression,
  LogicalTree,
  LogicalTreeOperation,
  WhereClause,
} from "../../ast/filtering.js"
import type { ValueTypes } from "../../ast/values.js"
import { parseColumnReference, type ParseColumnDetails } from "./columns.js"
import type { PartialParserResult } from "./common.js"
import {
  takeUntil,
  takeWhile,
  type ExtractUntil,
  type NextToken,
  type SplitWords,
} from "./normalize.js"
import type {
  GetComparisonOperations,
  GetQuote,
  ParserOptions,
} from "./options.js"
import type { ParseValueOrReference } from "./utils.js"
import { parseValue, type ExtractValue } from "./values.js"

// This entire thing needs a re-write...

/**
 * Parse the {@link WhereClause} from the token stack
 *
 * @param tokens The tokens to parse
 * @param options The current {@link ParserOptions}
 * @returns A {@link WhereClause} if one is found
 */
export function parseWhere(
  tokens: string[],
  options: ParserOptions
): WhereClause | object {
  if (tokens.length === 0) {
    return {}
  }

  if ("WHERE" !== tokens.shift()) {
    throw new Error(`Invalid where tokens`)
  }

  return {
    where: parseLogicalExpression(tokens, options),
  }
}

/**
 *
 * @param tokens The current token stack
 * @param _options The current {@link ParserOptions}
 * @returns The next {@link LogicalExpression} from the token stack
 */
function parseLogicalExpression(
  tokens: string[],
  options: ParserOptions // TODO: Pass this through for filtering ops
): LogicalExpression {
  const segments = tokens.join(" ").split(/(?=[>=<!])|(?<=[>=<!])/g)
  const left = takeUntil(segments, options.tokens.comparisons).join(" ").trim()
  const op = takeWhile(segments, options.tokens.comparisons).join("")
  const right = segments.join(" ").trim()

  return {
    type: "ColumnFilter",
    column: parseColumnReference(left.split(" ")),
    op: op as ComparisonOperation,
    filter: parseValue(right, options.tokens.quote),
  }
}

/**
 * Extract a {@link WhereClause} from the end of the SQL provided in the {@link PartialParserResult}
 */
export type ExtractWhere<
  Current extends PartialParserResult,
  Options extends ParserOptions
> = Current extends PartialParserResult<infer SQL, infer Result>
  ? SQL extends `${infer QuerySegment} WHERE ${infer Where}`
    ? ParseExpressionTree<
        Join<SplitWhere<Where>>,
        Options
      > extends infer Exp extends LogicalExpression
      ? PartialParserResult<QuerySegment, Flatten<Result & WhereClause<Exp>>>
      : PartialParserResult<SQL, Result>
    : Current
  : never

/**
 * Split the where statement by potential filtering operations
 */
type SplitWhere<T> = T extends `${infer Left}<>${infer Right}`
  ? [...SplitWhere<Left>, "<>", ...SplitWhere<Right>]
  : T extends `${infer Left}>${infer Next}${infer Right}`
  ? SplitEqual<Left, Next, Right, ">">
  : T extends `${infer Left}<${infer Next}${infer Right}`
  ? SplitEqual<Left, Next, Right, "<">
  : T extends `${infer Left}=${infer Right}`
  ? [...SplitWhere<Left>, "=", ...SplitWhere<Right>]
  : SplitWords<T>

/**
 * Split out a possible trailing '=' character
 */
type SplitEqual<
  Left extends string,
  Next extends string,
  Right extends string,
  C extends string
> = Next extends "="
  ? [...SplitWhere<Left>, `${C}=`, ...SplitWhere<Right>]
  : [...SplitWhere<Left>, C, ...SplitWhere<`${Next}${Right}`>]

/**
 * Parse an expression tree
 */
type ParseExpressionTree<
  SQL extends string,
  Options extends ParserOptions
> = ExtractLogical<SQL, Options> extends LogicalTree<
  infer Left,
  infer Op,
  infer Right
>
  ? LogicalTree<Left, Op, Right>
  : ParseColumnFilter<SQL, Options> extends ColumnFilter<
      infer Left,
      infer Op,
      infer Right
    >
  ? ColumnFilter<Left, Op, Right>
  : Trim<SQL> extends `( ${infer Inner} )`
  ? ParseExpressionTree<Inner, Options>
  : Invalid<`invalid expression: ${SQL & string}`>

/**
 * Extract a {@link LogicalTree}
 */
type ExtractLogical<
  SQL extends string,
  Options extends ParserOptions
> = ExtractUntil<SQL, LogicalTreeOperation> extends [
  infer Left extends string,
  infer Remainder extends string
]
  ? NextToken<Remainder> extends [
      infer Operation extends string,
      infer Right extends string
    ]
    ? [Operation] extends [LogicalTreeOperation]
      ? CheckLogicalTree<
          ParseExpressionTree<Left, Options>,
          Operation,
          ParseExpressionTree<Right, Options>
        >
      : never
    : never
  : ParseColumnFilter<SQL, Options> extends ColumnFilter<
      infer Left,
      infer Op,
      infer Right
    >
  ? ColumnFilter<Left, Op, Right>
  : Invalid<`Cannot parse logical or conditional filter from ${SQL & string}`>

/**
 * Check the logical tree to ensure it's correctly formed or extract/generate an
 * Invalid error message
 */
type CheckLogicalTree<Left, Operation, Right> = Left extends LogicalExpression
  ? Right extends LogicalExpression
    ? Operation extends LogicalTreeOperation
      ? LogicalTree<Left, Operation, Right>
      : Invalid<"Invalid logical tree detected">
    : Right extends Invalid<infer Reason>
    ? Invalid<Reason>
    : Invalid<"Invalid logical tree detected">
  : Left extends Invalid<infer Reason>
  ? Invalid<Reason>
  : Invalid<"Invalid logical tree detected">

/**
 * Parse out a {@link ColumnFilter}
 */
type ParseColumnFilter<
  SQL extends string,
  Options extends ParserOptions
> = NextToken<SQL> extends [
  infer Column extends string,
  infer Exp extends string
]
  ? NextToken<Exp> extends [infer Op extends string, infer Value extends string]
    ? Op extends GetComparisonOperations<Options>
      ? ExtractValue<Value, GetQuote<Options>> extends [infer V extends string]
        ? CheckFilter<
            ColumnReference<ParseColumnDetails<Column & string>>,
            Op,
            ParseValueOrReference<V, Options>
          >
        : Invalid<`Failed to parse column filter: ${SQL & string}`>
      : Invalid<`Failed to parse column filter: ${SQL & string}`>
    : Invalid<`Failed to parse column filter: ${SQL & string}`>
  : Invalid<`Failed to parse column filter: ${SQL & string}`>

/**
 * Check that the column filter is appropriate and well formed
 */
type CheckFilter<Left, Operation, Right> = Left extends ColumnReference<
  infer Reference,
  infer Alias
>
  ? [Operation] extends [ComparisonOperation]
    ? Right extends ValueTypes
      ? ColumnFilter<ColumnReference<Reference, Alias>, Operation, Right>
      : Right extends Invalid<infer Reason>
      ? Invalid<Reason>
      : Invalid<`Invalid column filter`>
    : Invalid<`Invalid column filter`>
  : Left extends Invalid<infer Reason>
  ? Invalid<Reason>
  : Invalid<`Invalid column filter`>

/**
 * Process: WHERE {clause}
 *
 * Clause can be:
 * 1. Column filter: a {filter} b
 * 2. Subquery filter: a [NOT] IN (subquery or values)
 */
