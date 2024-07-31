import type { ReturningClause } from "../../ast/queries.js"
import { parseSelectedColumns } from "./columns.js"
import type { GetQuote, ParserOptions } from "./options.js"

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

export type RemoveQuotes<
  S extends string,
  Options extends ParserOptions
> = GetQuote<Options> extends infer Quote extends string
  ? S extends `${Quote}${infer Unquoted}${Quote}`
    ? Unquoted
    : S
  : S

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
