import type { IgnoreAny } from "@telefrek/type-utils/common"
import type { ColumnReference } from "./columns.js"
import type { ValueTypes } from "./values.js"

/**
 * Types for Arithmetic operations
 */
export type ArithmeticOperation = "+" | "-" | "*" | "/" | "%" | "|" | "&" | "^"

/**
 * The default arithmetic operations
 */
export const DEFAULT_ARITHMETIC_OPS: ArithmeticOperation[] = [
  "%",
  "&",
  "*",
  "+",
  "-",
  "/",
  "^",
  "|",
]

/**
 * Types for Arithmetic assignment
 */
export type ArithmeticAssignmentOperation = `${ArithmeticOperation}=` | "="

/**
 * The default arithmetic assignment operations
 */
export const DEFAULT_ARITHMETIC_ASSIGNMENT_OPS: ArithmeticAssignmentOperation[] =
  ["%=", "&=", "*=", "+=", "-=", "/=", "^=", "|=", "="]

/**
 * An arithmetic assignment expression, ex: column += b
 */
export type ColumnArithmeticAssignment<
  Column extends ColumnReference = ColumnReference,
  Op extends string = ArithmeticAssignmentOperation,
  Value extends ArithmeticExpressionType = ArithmeticExpressionType
> = {
  type: "ColumnArithmeticAssignment"
  column: Column
  operation: Op
  value: Value
}

/**
 * The default type for an arithmetic expression
 */
export type ArithmeticExpressionType =
  | ColumnReference
  | ValueTypes
  | ArithmeticExpression<IgnoreAny, string, IgnoreAny>
  | GroupedArithmeticExpression<IgnoreAny>
  | ColumnArithmeticAssignment<ColumnReference, string, IgnoreAny>

/**
 * A grouped expression (surrounded by parenthesis)
 */
export type GroupedArithmeticExpression<
  Expression extends ArithmeticExpression<
    IgnoreAny,
    string,
    IgnoreAny
  > = ArithmeticExpression<IgnoreAny, string, IgnoreAny>
> = {
  type: "GroupedArithmeticExpression"
  expression: Expression
}

/**
 * An arithmetic expression between two values, ex: a + b
 */
export type ArithmeticExpression<
  Left extends ArithmeticExpressionType = ArithmeticExpressionType,
  Op extends string = ArithmeticOperation,
  Right extends ArithmeticExpressionType = ArithmeticExpressionType
> = {
  type: "ArithmeticExpression"
  left: Left
  operation: Op
  right: Right
}
