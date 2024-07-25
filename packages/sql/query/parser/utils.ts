import type { NamedQuery } from "../../ast/named.js"
import type { ReturningClause } from "../../ast/queries.js"
import { parseSelectedColumns } from "./columns.js"
import { extractParenthesis } from "./normalize.js"
import { parseQueryClause } from "./query.js"

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
 * Attempt to parse out a named query
 *
 * @param tokens The token stack to process
 * @returns The next {@link NamedQuery} if one exists
 */
export function tryParseNamedQuery(tokens: string[]): NamedQuery | undefined {
  // Check for a named query segment
  if (tokens.length > 0 && tokens[0] === "(") {
    // Read everything between the ()
    const queryTokens = extractParenthesis(tokens)

    // Extract the query clause and validate it was consumed
    const clause = parseQueryClause(queryTokens)
    if (queryTokens.length > 0) {
      throw new Error(
        `Failed to fully parse subquery remainder: ${queryTokens.join(" ")}`
      )
    }

    // Return the named query segment
    return {
      type: "NamedQuery",
      query: clause,
      alias: tryParseAlias(tokens),
    }
  }

  return
}

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
