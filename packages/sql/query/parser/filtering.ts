import type { Invalid } from "@telefrek/type-utils/common"
import type { ColumnReference } from "../../ast/columns.js"
import type { ColumnFilter, LogicalExpression } from "../../ast/expressions.js"
import type { ValueTypes } from "../../ast/values.js"
import type { CheckEqualParenthesis, NextToken } from "./normalize.js"
import type {
  DEFAULT_PARSER_OPTIONS,
  GetComparisonOperations,
  ParserOptions,
} from "./options.js"
import type { ExtractGroup, ParseValueOrReference } from "./utils.js"

/**
 * Parser for logical expressions
 */
export type ParseLogicalExpression<
  SQL extends string,
  Options extends ParserOptions
> = ParseNextExpression<SQL, Options>

export type t = ParseNextExpression<"a - b + c >= d", DEFAULT_PARSER_OPTIONS>

type ParseNextExpression<
  SQL extends string,
  Options extends ParserOptions,
  _State extends LogicalExpression = never
> = CheckEqualParenthesis<SQL> extends false
  ? Invalid<"unbalanced parenthesis">
  : NextToken<SQL> extends [
      infer Token extends string,
      infer Remainder extends string
    ]
  ? Token extends GetComparisonOperations<Options>
    ? `Comparison: ${Token}`
    : Token extends ")"
    ? Invalid<"Corrupt syntax, extra )">
    : Token extends "("
    ? ExtractGroup<Remainder> extends [
        infer Group extends string,
        infer _Rest extends string
      ]
      ? Group
      : Invalid<"corrupt group">
    : ParseValueOrReference<Token, Options> extends infer CRef extends
        | ColumnReference
        | ValueTypes
    ? CRef extends ColumnReference
      ? ParseColumnExpression<Remainder, Options, CRef>
      : CRef
    : Token
  : Invalid<"failed to parse expression">

type ParseSingleExpression<
  SQL extends string,
  Options extends ParserOptions,
  Expression
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? [Token, Expression, Remainder]
  : ReadNextToken<SQL, Options>

type ParseColumnExpression<
  SQL extends string,
  Options extends ParserOptions,
  Column extends ColumnReference
> = ReadNextToken<SQL, Options> extends [
  infer Token,
  infer Remainder extends string
]
  ? Token extends GetComparisonOperations<Options>
    ? ParseSingleExpression<
        Remainder,
        Options,
        ColumnFilter<Column, Token, never>
      >
    : Invalid<"nope">
  : ReadNextToken<SQL, Options>

type ReadNextToken<
  SQL extends string,
  Options extends ParserOptions
> = NextToken<SQL> extends [
  infer Token extends string,
  infer Remainder extends string
]
  ? Token extends GetComparisonOperations<Options>
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
