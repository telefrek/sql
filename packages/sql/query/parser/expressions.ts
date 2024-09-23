import type { IgnoreAny, Invalid } from "@telefrek/type-utils/common"

import type { ColumnReference } from "../../ast/columns.js"
import type {
  ArithmeticExpression,
  ColumnArithmeticAssignment,
  ColumnFilter,
  LogicalExpression,
  LogicalGroup,
  LogicalNegation,
  LogicalOperation,
  LogicalTree,
} from "../../ast/expressions.js"
import type { ValueTypes } from "../../ast/values.js"
import type { NextToken } from "./normalize.js"
import {
  type GetArithmeticOperations,
  type GetAssignmentOperations,
  type GetComparisonOperations,
  type GetOverridableTokens,
  type ParserOptions,
} from "./options.js"
import {
  extractGroup,
  parseValueOrReference,
  type ExtractGroup,
  type ParseValueOrReference,
} from "./utils.js"

/**
 * Utility to get the full expression type
 */
type GetFullExpressionType<
  SQL extends string,
  Options extends ParserOptions
> = ParseExpressionTree<SQL, Options> extends [infer Expression, ""]
  ? Expression
  : never

/**
 * Parse the SQL string as an expression
 * @param sql The SQL to parse as an expression
 * @param options The options to use
 */
export function parseArithmeticExpression<
  SQL extends string,
  Options extends ParserOptions
>(sql: SQL, options: Options): GetFullExpressionType<SQL, Options>

/**
 * Parse the next arithmetic expression from the stack
 *
 * @param tokens The current token stack
 * @param options The parser options to use
 * @param current The current expression if one exists
 */
export function parseArithmeticExpression<
  Expression extends LogicalExpression,
  Options extends ParserOptions
>(
  tokens: string[],
  options: Options,
  current?: Expression
): LogicalExpression | undefined

// Implementation
export function parseArithmeticExpression<Options extends ParserOptions>(
  sql: unknown,
  options: Options,
  current?: LogicalExpression
): unknown {
  const tokens = typeof sql === "string" ? sql.split(" ") : (sql as string[])

  // Create a copy of the tokens in case of partial reads
  const copy = [...tokens]

  if (current !== undefined) {
    const token = readNextToken(copy, options)
    if (typeof token === "string") {
      // Only allow additional arithmetic
      if (options.tokens.arithmetic.indexOf(token) >= 0) {
        return parseSingleArithmeticExpression(copy, options, {
          type: "ArithmeticExpression",
          left: current,
          operation: token,
        })
      }
    } else if (token === undefined) {
      return copy.length === 0 ? current : undefined
    }

    return
  }

  const next = parseNextArithmeticExpression(copy, options)
  if (next !== undefined) {
    const fullExpression = parseArithmeticExpression(
      copy,
      options,
      next as LogicalExpression
    )

    const diff = tokens.length - copy.length
    tokens.splice(0, diff)

    return fullExpression ?? next
  }

  return
}

/**
 * Parse the entire token stack as an expression or return undefined
 *
 * @param tokens The current token stack
 * @param options The parsing options
 * @returns Either a fully consumed expression or undefined
 */
function parseGroupExpression(
  tokens: string[],
  options: ParserOptions
): LogicalGroup | undefined {
  const copy = [...tokens]

  const expression = parseArithmeticExpression(copy, options)
  if (
    expression !== undefined &&
    copy.length === 0 &&
    expression.type === "ArithmeticExpression"
  ) {
    tokens.splice(0, tokens.length)
    return {
      type: "LogicalGroup",
      operation: "LogicalGroup",
      expression,
    }
  }

  return
}

/**
 * Get the next token value
 */
type ReadNextToken<
  SQL extends string,
  Options extends ParserOptions
> = NextToken<SQL> extends [
  infer Token extends string,
  infer Remainder extends string
]
  ? Token extends GetOverridableTokens<Options>
    ? [Token, Remainder]
    : Token extends "AND" | "OR" | "NOT"
    ? [Token, Remainder]
    : Token extends ")"
    ? Invalid<"Invalid syntax, extra )">
    : Token extends "("
    ? ExtractGroup<Remainder> extends [
        infer Group extends string,
        infer Rest extends string
      ]
      ? [Group, Rest]
      : Invalid<"Corrupt group">
    : ParseValueOrReference<Token, Options> extends infer CRef extends
        | ColumnReference
        | ValueTypes
    ? [CRef, Remainder]
    : Invalid<"Cannot map value">
  : Invalid<"No more tokens to extract">

/**
 * Read the next value from the stack
 * @param tokens The current token stack
 * @param options The parsing options to use
 * @returns A column reference, value or group
 */
export function readNextToken(
  tokens: string[],
  options: ParserOptions
): ValueTypes | ColumnReference | string[] | string | undefined {
  if (tokens.length === 0) {
    return
  }

  switch (true) {
    case tokens[0] === ")":
      throw new Error("Corrupt group")
    case tokens[0] === "(":
      tokens.shift()
      return extractGroup(tokens)
    case options.tokens.arithmetic.indexOf(tokens[0]) >= 0:
      return tokens.shift()!
    case options.tokens.assignments.indexOf(tokens[0]) >= 0:
      return tokens.shift()!
    case options.tokens.comparisons.indexOf(tokens[0]) >= 0:
      return tokens.shift()!
    case ["AND", "OR", "NOT"].indexOf(tokens[0]) >= 0:
      return tokens.shift()!
  }

  return parseValueOrReference(tokens, options)
}

function parseNextArithmeticExpression(
  tokens: string[],
  options: ParserOptions
): Partial<LogicalExpression> | undefined {
  const token = readNextToken(tokens, options)
  if (token === undefined) {
    return
  }

  // Group
  if (Array.isArray(token)) {
    return parseGroupExpression(token, options)
  } else if (typeof token === "string") {
    return
  } else if (token.type === "ColumnReference") {
    return parseColumnExpression(tokens, options, token)
  } else {
    return parseValueExpression(tokens, options, token)
  }
}

function parseColumnExpression(
  tokens: string[],
  options: ParserOptions,
  column: ColumnReference
): LogicalExpression | undefined {
  const token = readNextToken(tokens, options)
  if (typeof token === "string") {
    if (options.tokens.assignments.indexOf(token) >= 0) {
      return parseColumnAssignmentExpression(tokens, options, {
        type: "ColumnArithmeticAssignment",
        column,
        operation: token,
      })
    } else {
      return parseSingleArithmeticExpression(tokens, options, {
        type: "ArithmeticExpression",
        left: column,
        operation: token,
      })
    }
  }

  return
}

function parseColumnAssignmentExpression<
  Assignment extends Partial<
    ColumnArithmeticAssignment<ColumnReference, string, never>
  >
>(
  tokens: string[],
  options: ParserOptions,
  assignment: Assignment
): ColumnArithmeticAssignment<ColumnReference, string, IgnoreAny> | undefined {
  const token = readNextToken(tokens, options)
  if (token === undefined) {
    return
  }

  if (typeof token === "string") {
    return
  } else if (Array.isArray(token)) {
    const value = parseGroupExpression(token, options)
    if (value === undefined) return
    return {
      ...assignment,
      value,
    } as ColumnArithmeticAssignment<ColumnReference, string, IgnoreAny>
  }

  return {
    ...assignment,
    value: token,
  } as ColumnArithmeticAssignment<ColumnReference, string, IgnoreAny>
}

function parseSingleArithmeticExpression<
  Expression extends Partial<ArithmeticExpression<IgnoreAny, string, never>>
>(
  tokens: string[],
  options: ParserOptions,
  expression: Expression
): ArithmeticExpression<IgnoreAny, string, IgnoreAny> | undefined {
  const token = readNextToken(tokens, options)
  if (token === undefined) {
    return
  }

  if (typeof token === "string") {
    return
  } else if (Array.isArray(token)) {
    const right = parseGroupExpression(token, options)
    if (right === undefined) return
    return { ...expression, right } as ArithmeticExpression<
      IgnoreAny,
      string,
      IgnoreAny
    >
  }

  return {
    ...expression,
    right: token,
  } as ArithmeticExpression<IgnoreAny, string, IgnoreAny>
}

function parseValueExpression(
  tokens: string[],
  options: ParserOptions,
  value: ValueTypes
): Partial<ArithmeticExpression<ValueTypes, string, never>> | undefined {
  const token = readNextToken(tokens, options)
  if (
    typeof token === "string" &&
    options.tokens.arithmetic.indexOf(token) >= 0
  ) {
    return {
      type: "ArithmeticExpression",
      left: value,
      operation: token,
    }
  }

  return
}

// Start by parsing the next unit (column, value, token)
// Get next "operator"
// Parse the next chunk, repeat until done

type ParseNextLogicalObject<
  SQL extends string,
  Options extends ParserOptions
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? Token extends GetAssignmentOperations<Options>
    ? [ColumnArithmeticAssignment<never, Token, never>, Remainder]
    : Token extends GetArithmeticOperations<Options>
    ? [ArithmeticExpression<never, Token, never>, Remainder]
    : Token extends GetComparisonOperations<Options>
    ? [ColumnFilter<never, Token, never>, Remainder]
    : Token extends ColumnReference
    ? [Token, Remainder]
    : Token extends ValueTypes
    ? [Token, Remainder]
    : Token extends "AND" | "OR"
    ? [LogicalTree<never, Token, never>, Remainder]
    : Token extends "NOT"
    ? [LogicalNegation<never>, Remainder]
    : Token extends string
    ? ParseExpressionTree<Token, Options> extends [
        infer Exp extends LogicalOperation,
        ""
      ]
      ? [LogicalGroup<Exp>, Remainder]
      : Invalid<"Failed to process group">
    : Invalid<"Cannot process token">
  : ReadNextToken<SQL, Options>

/**
 * Main entrypoint that parses as much of the SQL as an expression tree as
 * possible while returning the remainder
 */
export type ParseExpressionTree<
  SQL extends string,
  Options extends ParserOptions
> = ParseAllExpressionTokens<SQL, Options> extends [
  infer Exp extends LogicalExpression[],
  infer Remainder extends string
]
  ? CollapseExpressions<Exp> extends infer Consolidated extends LogicalExpression
    ? [Consolidated, Remainder]
    : CollapseExpressions<Exp>
  : Invalid<"Failed to parse an expression">

export function parseAllExpressionTokens(
  tokens: string[],
  options: ParserOptions
): LogicalExpression | undefined {
  const expressions: Partial<LogicalExpression>[] = []

  let next = readNextToken(tokens, options)
  while (next !== undefined) {
    if (typeof next === "string") {
      if (options.tokens.arithmetic.indexOf(next) >= 0) {
        expressions.push({ type: "ArithmeticExpression", operation: next })
      } else if (options.tokens.assignments.indexOf(next) >= 0) {
        expressions.push({
          type: "ColumnArithmeticAssignment",
          operation: next,
        })
      } else if (options.tokens.comparisons.indexOf(next) >= 0) {
        expressions.push({ type: "ColumnFilter", operation: next })
      } else if (next === "NOT") {
        expressions.push({ type: "LogicalNegation" })
      } else if (next === "AND" || next === "OR") {
        expressions.push({ type: "LogicalTree", operation: next })
      }
    } else if (Array.isArray(next)) {
      const exp = parseAllExpressionTokens(next, options)
      if (exp !== undefined) {
        expressions.push(exp)
      } else throw new Error("oops")
    } else {
      expressions.push(next)
    }

    if (tokens.length === 0) break
    next = readNextToken(tokens, options)
  }

  return aggregateExpressions(expressions)
}

function aggregateExpressions(
  expressions: Partial<LogicalExpression>[]
): LogicalExpression | undefined {
  while (expressions.length > 1) {
    const second = expressions.pop()!
    const first = expressions.pop()!

    switch (first.type ?? "undefined") {
      case "ColumnArighmeticAssignment":
        ;(first as ColumnArithmeticAssignment).value =
          second as LogicalExpression
        expressions.push(first)
        continue
      case "ColumnFilter":
        ;(first as ColumnFilter).filter = second as LogicalExpression
        expressions.push(first)
        continue
      case "ArithmeticExpression":
        ;(first as ArithmeticExpression).right = second as LogicalExpression
        expressions.push(first)
        continue
      case "LogicalNegation":
        ;(first as LogicalNegation).expression = second as LogicalExpression
        expressions.push(first)
        continue
      case "LogicalTree":
        ;(first as LogicalTree).right = second as LogicalExpression
        expressions.push(first)
        continue
    }

    switch (second.type ?? "undefined") {
      case "ColumnArithmeticAssignment":
        ;(second as ColumnArithmeticAssignment).column =
          first as ColumnReference
        expressions.push(second)
        continue
      case "ColumnFilter":
        ;(second as ColumnFilter).column = first as ColumnReference
        expressions.push(second)
        continue
      case "ArithmeticExpression":
        ;(second as ArithmeticExpression).left = first as LogicalExpression
        expressions.push(second)
        continue
      case "LogicalTree": {
        expressions.push(first)
        const left = aggregateExpressions(expressions)
        if (left === undefined)
          throw new Error("Failed to parse left side of tree")
        ;(second as LogicalTree).left = left
        return second as LogicalExpression
      }
    }
  }

  if (expressions.length === 1) {
    return expressions[0] as LogicalExpression
  }

  return
}

/**
 * Parse out all of the valid individual expression tokens and return them with
 * the remainding string
 */
type ParseAllExpressionTokens<
  SQL extends string,
  Options extends ParserOptions,
  Current extends LogicalExpression[] = []
> = SQL extends ""
  ? [Current, SQL]
  : ParseNextLogicalObject<SQL, Options> extends [
      infer Token extends LogicalExpression,
      infer Remainder extends string
    ]
  ? ParseAllExpressionTokens<Remainder, Options, [...Current, Token]> extends [
      infer Tokens,
      infer R extends string
    ]
    ? [Tokens, R]
    : [[Token], Remainder]
  : [Current, SQL]

/**
 * Collapse a series of logical expressions into a single expression
 */
type CollapseExpressions<Expressions extends LogicalExpression[]> =
  Expressions extends [
    ...infer Rest extends LogicalExpression[],
    infer First extends LogicalExpression,
    infer Second extends LogicalExpression
  ]
    ? First extends ColumnArithmeticAssignment<never, infer Token, never>
      ? CollapseExpressions<
          [...Rest, ColumnArithmeticAssignment<never, Token, Second>]
        >
      : First extends ColumnFilter<never, infer Token, never>
      ? CollapseExpressions<[...Rest, ColumnFilter<never, Token, Second>]>
      : First extends ArithmeticExpression<never, infer Token, never>
      ? CollapseExpressions<
          [...Rest, ArithmeticExpression<never, Token, Second>]
        >
      : First extends LogicalNegation<never>
      ? CollapseExpressions<[...Rest, LogicalNegation<Second>]>
      : First extends LogicalTree<never, infer Token, never>
      ? CollapseExpressions<[...Rest, LogicalTree<never, Token, Second>]>
      : Second extends ColumnArithmeticAssignment<
          never,
          infer Token,
          infer Right
        >
      ? First extends ColumnReference
        ? CollapseExpressions<
            [...Rest, ColumnArithmeticAssignment<First, Token, Right>]
          >
        : Invalid<"Cannot do assignment on non-column reference">
      : Second extends ColumnFilter<never, infer Token, infer Right>
      ? First extends ColumnReference
        ? CollapseExpressions<[...Rest, ColumnFilter<First, Token, Right>]>
        : Invalid<"Cannot do column filtering on non-column reference">
      : Second extends ArithmeticExpression<never, infer Token, infer Right>
      ? CollapseExpressions<
          [...Rest, ArithmeticExpression<First, Token, Right>]
        >
      : Second extends LogicalTree<never, infer Token, infer Right>
      ? CollapseExpressions<
          [...Rest, First]
        > extends infer Exp extends LogicalExpression
        ? LogicalTree<Exp, Token, Right>
        : Invalid<"failed to parse tree">
      : Expressions
    : Expressions extends [infer Exp extends LogicalExpression]
    ? Exp
    : Invalid<"Corrupt or empty expression group">
