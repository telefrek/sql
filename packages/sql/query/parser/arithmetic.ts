import type { IgnoreAny, Invalid } from "@telefrek/type-utils/common"
import {
  type ArithmeticExpression,
  type ColumnArithmeticAssignment,
  type GroupedArithmeticExpression,
} from "../../ast/arithmetic.js"
import type { ColumnReference } from "../../ast/columns.js"
import type { ValueTypes } from "../../ast/values.js"
import type { NextToken } from "./normalize.js"
import {
  type GetArithmeticOperations,
  type GetAssignmentOperations,
  type ParserOptions,
} from "./options.js"
import type { ExtractGroup, ParseValueOrReference } from "./utils.js"

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
      ? [GroupedArithmeticExpression<Tree>, Remainder]
      : ParseEntireArithmeticTree<Token, Options>
    : Invalid<"Invalid token">
  : ReadNextToken<SQL, Options>

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

/**
 * Parse only the next segment
 */
type ParseSingleArithmeticExpression<
  SQL extends string,
  Options extends ParserOptions,
  Expression extends ArithmeticExpression<IgnoreAny, string, never>
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
        ? [
            ArithmeticExpression<Left, Op, GroupedArithmeticExpression<Right>>,
            Remainder
          ]
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
      > extends infer Expression extends AnyExpression
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
type AnyExpression =
  | ArithmeticExpression<IgnoreAny, string, IgnoreAny>
  | GroupedArithmeticExpression<IgnoreAny>

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
