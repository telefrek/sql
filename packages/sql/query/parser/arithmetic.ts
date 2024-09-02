import type { IgnoreAny, Invalid } from "@telefrek/type-utils/common"

import type { ColumnReference } from "../../ast/columns.js"
import type {
  ArithmeticExpression,
  ColumnArithmeticAssignment,
  LogicalExpression,
  LogicalGroup,
} from "../../ast/expressions.js"
import type { ValueTypes } from "../../ast/values.js"
import type { NextToken } from "./normalize.js"
import {
  type GetArithmeticOperations,
  type GetAssignmentOperations,
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
> = ParseArithmeticExpression<SQL, Options> extends [infer Expression, ""]
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
  Expression extends AnyExpression,
  Options extends ParserOptions
>(
  tokens: string[],
  options: Options,
  current?: Expression
): AnyExpression | undefined

// Implementation
export function parseArithmeticExpression<Options extends ParserOptions>(
  sql: unknown,
  options: Options,
  current?: AnyExpression
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
      next as AnyExpression
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
 * Extract the next valid expression chunk and the remaining string
 */
export type ParseArithmeticExpression<
  SQL extends string,
  Options extends ParserOptions,
  Current extends AnyExpression = never
> = [Current] extends [never]
  ? ParseNextArithmeticExpression<SQL, Options> extends [
      infer Expression extends AnyExpression,
      infer Remainder extends string
    ]
    ? Remainder extends ""
      ? [Expression, ""]
      : ParseArithmeticExpression<Remainder, Options, Expression>
    : ParseNextArithmeticExpression<SQL, Options>
  : ReadNextToken<SQL, Options> extends [
      infer Token,
      infer Remainder extends string
    ]
  ? Token extends GetArithmeticOperations<Options>
    ? ParseSingleArithmeticExpression<
        Remainder,
        Options,
        ArithmeticExpression<Current, Token, never>
      > extends [
        infer Expression extends AnyExpression,
        infer Rest extends string
      ]
      ? Rest extends ""
        ? [Expression, ""]
        : ParseArithmeticExpression<Rest, Options, Expression>
      : ParseSingleArithmeticExpression<
          Remainder,
          Options,
          ArithmeticExpression<Current, Token, never>
        >
    : [Current, SQL] // Return
  : [Current, SQL] // Return expression and remainder

/**
 * Get the types of tokens supported
 */
type GetTokenTypes<Options extends ParserOptions> =
  | GetArithmeticOperations<Options>
  | GetAssignmentOperations<Options>
  | ColumnReference
  | ValueTypes

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
  ? Token extends GetArithmeticOperations<Options>
    ? [Token, Remainder]
    : Token extends GetAssignmentOperations<Options>
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
  }

  return parseValueOrReference(tokens, options)
}

/**
 * Parse the next {@link ArithmeticExpression} from the provided string
 */
type ParseNextArithmeticExpression<
  SQL extends string,
  Options extends ParserOptions
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? Token extends ColumnReference
    ? ParseColumnExpression<Remainder, Options, Token>
    : Token extends ValueTypes
    ? ParseValueExpression<Remainder, Options, Token>
    : Token extends GetTokenTypes<Options>
    ? Invalid<"Cannot start an operation with an assignment or arithmetic sign">
    : Token extends string
    ? ParseEntireArithmeticTree<
        Token,
        Options
      > extends infer Tree extends ArithmeticExpression<
        IgnoreAny,
        string,
        IgnoreAny
      >
      ? [LogicalGroup<Tree>, Remainder]
      : ParseEntireArithmeticTree<Token, Options>
    : Invalid<"Invalid token">
  : ReadNextToken<SQL, Options>

function parseNextArithmeticExpression(
  tokens: string[],
  options: ParserOptions
): Partial<AnyExpression> | undefined {
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

/**
 * Parse expressions starting with a column
 */
type ParseColumnExpression<
  SQL extends string,
  Options extends ParserOptions,
  Column extends ColumnReference
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? Token extends GetArithmeticOperations<Options>
    ? ParseSingleArithmeticExpression<
        Remainder,
        Options,
        ArithmeticExpression<Column, Token, never>
      >
    : Token extends GetAssignmentOperations<Options>
    ? ParseColumnAssignmentExpression<
        Remainder,
        Options,
        ColumnArithmeticAssignment<Column, Token, never>
      >
    : Invalid<"Column must be followed by an assignment or arithmetic operation">
  : ReadNextToken<SQL, Options>

function parseColumnExpression(
  tokens: string[],
  options: ParserOptions,
  column: ColumnReference
): AnyExpression | undefined {
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
    }
  }

  return {
    ...assignment,
    value: token,
  }
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
    return { ...expression, right }
  }

  return {
    ...expression,
    right: token,
  }
}

/**
 * Parse expressions starting with a value
 */
type ParseValueExpression<
  SQL extends string,
  Options extends ParserOptions,
  Value extends ValueTypes
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? Token extends GetArithmeticOperations<Options>
    ? [ArithmeticExpression<Value, Token, never>, Remainder]
    : Invalid<"Value must be followed by an arithmetic operation">
  : ReadNextToken<SQL, Options>

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

/**
 * Parse only the next segment
 */
type ParseSingleArithmeticExpression<
  SQL extends string,
  Options extends ParserOptions,
  Expression extends AnyExpression
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? Token extends ColumnReference | ValueTypes
    ? Expression extends ArithmeticExpression<infer Left, infer Op, infer _>
      ? [ArithmeticExpression<Left, Op, Token>, Remainder]
      : Invalid<"Corrupt expression">
    : Token extends GetTokenTypes<Options>
    ? Invalid<"Right hand side of expression must be a value, column or other expression">
    : Token extends string
    ? ParseEntireArithmeticTree<
        Token,
        Options
      > extends infer Right extends ArithmeticExpression<
        IgnoreAny,
        string,
        IgnoreAny
      >
      ? Expression extends ArithmeticExpression<infer Left, infer Op, infer _>
        ? [ArithmeticExpression<Left, Op, LogicalGroup<Right>>, Remainder]
        : Invalid<"Corrupted expression">
      : ParseEntireArithmeticTree<Token, Options>
    : Invalid<"Next token is not valid">
  : ReadNextToken<SQL, Options>

/**
 * Parse a column assignment
 *
 * Note: To be valid, the entire remainder must be consumable...
 */
type ParseColumnAssignmentExpression<
  SQL extends string,
  Options extends ParserOptions,
  Assignment extends ColumnArithmeticAssignment<ColumnReference, string, never>
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? Token extends ValueTypes | ColumnReference
    ? Assignment extends ColumnArithmeticAssignment<
        infer Column,
        infer Op,
        infer _
      >
      ? Remainder extends ""
        ? ColumnArithmeticAssignment<Column, Op, Token>
        : Invalid<"Cannot have assignment with trailing information">
      : Invalid<"Corrupt assignment">
    : Token extends GetTokenTypes<Options>
    ? Invalid<"Right hand side of assignment must be a value, column or other expression">
    : Token extends string
    ? ParseEntireArithmeticTree<
        Token,
        Options
      > extends infer Expression extends ArithmeticExpression
      ? Assignment extends ColumnArithmeticAssignment<
          infer Column,
          infer Op,
          infer _
        >
        ? ColumnArithmeticAssignment<Column, Op, Expression>
        : Invalid<"Corrupted column assignment">
      : ParseEntireArithmeticTree<Token, Options>
    : Invalid<"Invalid grouping in column assignment">
  : ReadNextToken<SQL, Options>

/**
 * Type to prevent assumption about operations from causing mismatch
 */
type AnyExpression = LogicalExpression

/**
 * Consume the entire arithmetic tree
 */
type ParseEntireArithmeticTree<
  SQL extends string,
  Options extends ParserOptions
> = ParseArithmeticExpression<SQL, Options> extends [
  infer Expression,
  infer Remainder extends string
]
  ? Remainder extends ""
    ? Expression
    : Invalid<"Failed to consume the entire SQL">
  : ParseArithmeticExpression<SQL, Options>
