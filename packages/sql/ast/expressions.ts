import type { ColumnReference } from "./columns.js"
import type { SubQuery } from "./queries.js"
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
 * Any logical operation
 */
export type LogicalOperation = {
  type: string
  operation: string
}

export function isLogicalOperation(value: unknown): value is LogicalOperation {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "operation" in value &&
    typeof value.type === "string" &&
    typeof value.operation === "string"
  )
}

/**
 * Types for for value comparisons
 */
export type ComparisonOperation = "=" | "<" | ">" | "<=" | ">=" | "!=" | "<>"

/**
 * The default comparison operations
 */
export const DEFAULT_COMPARISON_OPS: ComparisonOperation[] = [
  "=",
  "<",
  ">",
  "<=",
  ">=",
  "!=",
  "<>",
]

/**
 * A filter between two objects
 */
export type ColumnFilter<
  Column extends ColumnReference = ColumnReference,
  Operation extends string = ComparisonOperation,
  Filter extends LogicalExpression = LogicalExpression
> = {
  type: "ColumnFilter"
  column: Column
  operation: Operation
  filter: Filter
}

/**
 * An expression which could be an operation, value or column
 */
export type LogicalExpression = LogicalOperation | ValueTypes | ColumnReference

/**
 * Type for handling logical negations
 */
export type LogicalNegation<
  Expression extends LogicalExpression = LogicalExpression
> = LogicalOperation & {
  type: "LogicalNegation"
  operation: "NOT"
  expression: Expression
}

/**
 * An arithmetic assignment expression, ex: column += b
 */
export type ColumnArithmeticAssignment<
  Column extends ColumnReference = ColumnReference,
  Op extends string = ArithmeticAssignmentOperation,
  Value extends LogicalExpression = LogicalExpression
> = LogicalOperation & {
  type: "ColumnArithmeticAssignment"
  column: Column
  operation: Op
  value: Value
}

/**
 * An arithmetic expression between two values, ex: a + b
 */
export type ArithmeticExpression<
  Left extends LogicalExpression = LogicalExpression,
  Op extends string = ArithmeticOperation,
  Right extends LogicalExpression = LogicalExpression
> = LogicalOperation & {
  type: "ArithmeticExpression"
  left: Left
  operation: Op
  right: Right
}

/**
 * A grouped expression (surrounded by parenthesis)
 */
export type LogicalGroup<
  Expression extends LogicalOperation = LogicalOperation
> = {
  type: "LogicalGroup"
  operation: "LogicalGroup"
  expression: Expression
}

/**
 * A filter for a clause that matches something IN a set
 */
export type InFilter<
  Column extends ColumnReference = ColumnReference,
  Values extends SubQuery | ValueTypes[] = SubQuery | ValueTypes[]
> = LogicalOperation & {
  type: "InFilter"
  operation: "IN"
  column: Column
  values: Values
}

/**
 * A filter between two values
 */
export type BetweenFilter<
  Column extends ColumnReference = ColumnReference,
  Left extends LogicalExpression = LogicalExpression,
  Right extends LogicalExpression = LogicalExpression
> = LogicalOperation & {
  type: "BetweenFilter"
  operation: "BETWEEN"
  column: Column
  left: Left
  right: Right
}

/**
 * A logical tree operation
 */
export type LogicalTree<
  Left extends LogicalExpression = LogicalExpression,
  Operation extends string = "AND" | "OR",
  Right extends LogicalExpression = LogicalExpression
> = LogicalOperation & {
  type: "LogicalTree"
  operation: Operation
  left: Left
  right: Right
}

/**
 * A subquery filter that is NOT an "IN" because of syntax restrictions
 */
export type SubqueryFilter<
  Column extends ColumnReference = ColumnReference,
  Operation extends string = "ANY" | "ALL" | "EXISTS" | "SOME",
  Subquery extends SubQuery = SubQuery
> = LogicalOperation & {
  type: "SubqueryFilter"
  operation: Operation
  column: Column
  query: Subquery
}
