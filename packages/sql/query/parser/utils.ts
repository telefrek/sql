import type { Invalid } from "@telefrek/type-utils/common"
import type { Decrement, Increment } from "@telefrek/type-utils/math"
import type { Trim } from "@telefrek/type-utils/strings"
import type { ReturningClause } from "../../ast/queries.js"
import type { ValueTypes } from "../../ast/values.js"
import { parseSelectedColumns, type ParseColumnReference } from "./columns.js"
import type { NextToken } from "./normalize.js"
import type { GetQuote, ParserOptions } from "./options.js"
import type { CheckValueType } from "./values.js"

/**
 * Parse an optional alias from the stack
 *
 * @param tokens The current stack
 * @returns An alias if one is defined
 */
export function tryParseAlias(tokens: string[]): string | undefined {
  if (tokens.length > 1 && tokens[0] === "AS") {
    tokens.shift()
    return tokens.shift()
  }

  return
}

/**
 * Check if the string represents a single token
 */
export type IsSingleToken<T extends string> = T extends `${infer _} ${infer _}`
  ? false
  : true

/**
 * Type to try to parse a value and if not fallback and assume it is column reference
 */
export type ParseValueOrReference<
  SQL extends string,
  Options extends ParserOptions
> = CheckValueType<SQL, GetQuote<Options>> extends infer V extends ValueTypes
  ? V
  : ParseColumnReference<SQL>

/**
 * Extract the next full group from the current string
 */
export type ExtractGroup<
  SQL extends string,
  N extends number = 1,
  S extends string = ""
> = NextToken<SQL> extends [
  infer Next extends string,
  infer Remainder extends string
]
  ? Next extends ")"
    ? N extends 1
      ? [`${Trim<S>}`, Remainder]
      : ExtractGroup<Remainder, Decrement<N>, `${S} ${Next}`>
    : Next extends "("
    ? ExtractGroup<Remainder, Increment<N>, `${S} ${Next}`>
    : Remainder extends ""
    ? Invalid<"Unbalanced parenthesis">
    : ExtractGroup<Remainder, N, `${S} ${Next}`>
  : Invalid<"Unbalanced parenthesis">

export type RemoveQuotes<
  S extends string,
  Options extends ParserOptions
> = GetQuote<Options> extends infer Quote extends string
  ? S extends `${Quote}${infer Unquoted}${Quote}`
    ? Unquoted
    : S
  : S

/**
 * Check if the string is quoted
 */
export type IsQuoted<
  S extends string,
  Options extends ParserOptions
> = GetQuote<Options> extends infer Quote extends string
  ? S extends `${Quote}${string}${Quote}`
    ? true
    : false
  : false

/**
 * Attempts to read a RETURNING clause from the stack
 *
 * @param tokens The token stack to process
 * @returns The next {@link ReturningClause} if one exists
 */
export function tryParseReturning(
  tokens: string[]
): Partial<ReturningClause> | undefined {
  // Skip anything that isn't a returning
  if (tokens.length == 0 || tokens[0] !== "RETURNING") {
    return
  }

  // Strip the RETURNING
  tokens.shift()

  // If no tokens beyond this point that is bad
  if (tokens.length === 0) {
    throw new Error("corrupt RETURNING clause, no columns specified")
  }

  // Parse the columns which should match the collect
  return {
    returning: parseSelectedColumns(tokens),
  }
}
