import type { Invalid } from "@telefrek/type-utils/common"
import type { ColumnReference } from "../../ast/columns.js"
import type { LogicalExpression } from "../../ast/filtering.js"
import type { ValueTypes } from "../../ast/values.js"
import type { CheckEqualParenthesis, NextToken } from "./normalize.js"
import type { GetComparisonOperations, ParserOptions } from "./options.js"
import type { ExtractGroup, ParseValueOrReference } from "./utils.js"

/**
 * Parser for logical expressions
 */
export type ParseLogicalExpression<
  SQL extends string,
  Options extends ParserOptions
> = ParseNextExpression<SQL, Options>

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
    ? CRef
    : Token
  : Invalid<"failed to parse expression">
