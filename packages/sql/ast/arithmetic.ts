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
  Value extends ColumnReference | ValueTypes | ArithmenticExpressionTree =
    | ColumnReference
    | ValueTypes
    | ArithmenticExpressionTree
> = {
  type: "ColumnArithmeticAssignment"
  column: Column
  operation: Op
  value: Value
}

/**
 * An arithmetic expression between two values, ex: a + b
 */
export type ArithmeticExpression<
  Left extends ColumnReference | ValueTypes = ColumnReference | ValueTypes,
  Op extends string = ArithmeticOperation,
  Right extends ColumnReference | ValueTypes = ColumnReference | ValueTypes
> = {
  type: "ArithmeticExpression"
  left: Left
  operation: Op
  right: Right
}

/**
 * An arithmetic expression tree
 */
export type ArithmenticExpressionTree<
  Left extends ArithmeticExpression = ArithmeticExpression,
  Op extends string = ArithmeticOperation,
  Right extends ArithmeticExpression = ArithmeticExpression
> = {
  type: "ArithmeticExpressionTree"
  left: Left
  operation: Op
  right: Right
}
