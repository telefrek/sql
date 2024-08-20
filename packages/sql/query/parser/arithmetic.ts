import type { Invalid } from "@telefrek/type-utils/common"
import type {
  ArithmeticExpression,
  ArithmeticExpressionType,
  ColumnArithmeticAssignment,
  GroupedArithmeticExpression,
} from "../../ast/arithmetic.js"
import type { ColumnReference } from "../../ast/columns.js"
import type { ValueTypes } from "../../ast/values.js"
import type { CheckEqualParenthesis, NextToken } from "./normalize.js"
import type {
  GetArithmeticOperations,
  GetAssignmentOperations,
  ParserOptions,
} from "./options.js"
import type { ExtractGroup, ParseValueOrReference } from "./utils.js"

/**
 * Parse an {@link ArithmeticExpression}
 */
export type ParseArithmeticExpression<
  SQL extends string,
  Options extends ParserOptions
> = ParseNextExpression<SQL, Options>

// Keep reading next tokens
type ParseNextExpression<
  SQL extends string,
  Options extends ParserOptions,
  State extends ColumnReference | ValueTypes | ArithmeticExpressionType = never
> = CheckEqualParenthesis<SQL> extends false
  ? Invalid<"unbalanced parenthesis">
  : NextToken<SQL> extends [
      infer Next extends string,
      infer Remainder extends string
    ]
  ? Next extends GetArithmeticOperations<Options>
    ? [State] extends [never]
      ? Invalid<"Corrupt syntax for operation">
      : ParseNextExpression<
          Remainder,
          Options,
          ArithmeticExpression<State, Next, never>
        >
    : Next extends GetAssignmentOperations<Options>
    ? [State] extends [never]
      ? Invalid<"Corrupt syntax for assignment">
      : State extends ColumnReference
      ? ParseNextExpression<
          Remainder,
          Options
        > extends infer Exp extends ArithmeticExpressionType
        ? ColumnArithmeticAssignment<State, Next, Exp>
        : Invalid<"Right side of assignment is invalid">
      : Invalid<"Cannot assign to anything other than a column">
    : Next extends ")"
    ? Invalid<`Corrupt syntax, extra ')'`>
    : Next extends "("
    ? ExtractGroup<Remainder> extends [
        infer Group extends string,
        infer Rest extends string
      ]
      ? ParseNextExpression<
          Group,
          Options
        > extends infer Exp extends ArithmeticExpression
        ? [State] extends [never]
          ? Rest extends ""
            ? GroupedArithmeticExpression<Exp>
            : ParseNextExpression<
                Rest,
                Options,
                GroupedArithmeticExpression<Exp>
              >
          : State extends ColumnArithmeticAssignment<
              infer Column,
              infer Op,
              never
            >
          ? Rest extends ""
            ? ColumnArithmeticAssignment<
                Column,
                Op,
                GroupedArithmeticExpression<Exp>
              >
            : ParseNextExpression<
                Rest,
                Options,
                GroupedArithmeticExpression<Exp>
              > extends infer Exp2 extends ArithmeticExpressionType
            ? ColumnArithmeticAssignment<Column, Op, Exp2>
            : Invalid<"Assignment contains invalid partial expression">
          : State extends ArithmeticExpression<infer Left, infer Op, never>
          ? Rest extends ""
            ? ArithmeticExpression<Left, Op, GroupedArithmeticExpression<Exp>>
            : ParseNextExpression<
                Rest,
                Options,
                GroupedArithmeticExpression<Exp>
              > extends infer Exp2 extends ArithmeticExpressionType
            ? ArithmeticExpression<Left, Op, Exp2>
            : Invalid<"Corrupt expression">
          : Invalid<"State is invalid for group">
        : Invalid<"Groups must be arithmetic expressions">
      : Invalid<"Corrupt group">
    : ParseValueOrReference<Next, Options> extends infer CRef extends
        | ColumnReference
        | ValueTypes
    ? [State] extends [never]
      ? ParseNextExpression<Remainder, Options, CRef>
      : State extends ColumnReference | ValueTypes
      ? Invalid<"Multiple columns or values cannot be in sequence">
      : State extends ArithmeticExpression<infer Left, infer Op, never>
      ? Remainder extends ""
        ? ArithmeticExpression<Left, Op, CRef>
        : ParseNextExpression<
            Remainder,
            Options,
            ArithmeticExpression<Left, Op, CRef>
          >
      : Invalid<"Cannot append value or column to fully formed expression">
    : Invalid<`Failed to parse any useful value from ${Next}`>
  : Invalid<"Failed to parse expression">
