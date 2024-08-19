import type { IgnoreAny } from "@telefrek/type-utils/common.js"
import type { ColumnReference } from "./columns.js"
import type { SubQuery } from "./queries.js"
import type { ValueTypes } from "./values.js"

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
 * Types of subquery filtering mechanisms (IN is a special case)
 */
export type SubQueryFilterOperation = "ANY" | "ALL" | "EXISTS" | "SOME"

/**
 * Types of logical operations
 */
export type LogicalOperation = "BETWEEN" | "LIKE" | "ILIKE"

/**
 * Types for building logical trees
 */
export type LogicalTreeOperation = "AND" | "OR"

/**
 * Type for handling logical negations
 */
export type LogicalNegation<
  Expression extends LogicalExpression = LogicalExpression
> = {
  type: "LogicalNegation"
  expression: Expression
}

/**
 * A logical tree structure for processing groups of filters
 */
export type LogicalTree<
  Left extends LogicalExpression = LogicalExpression,
  Operation extends string = LogicalTreeOperation,
  Right extends LogicalExpression = LogicalExpression
> = {
  type: "LogicalTree"
  left: Left
  op: Operation
  right: Right
}

/**
 * The valid types for building a logical expression trees
 */
export type LogicalExpression =
  | ValueTypes
  | LogicalTree<IgnoreAny, string, IgnoreAny>
  | ColumnFilter
  | SubqueryFilter
  | LogicalNegation<IgnoreAny>

/**
 * A filter between two objects
 */
export type ColumnFilter<
  Column extends ColumnReference = ColumnReference,
  Operation extends string = ComparisonOperation,
  Filter extends ValueTypes | ColumnReference = ValueTypes | ColumnReference
> = {
  type: "ColumnFilter"
  column: Column
  op: Operation
  filter: Filter
}

/**
 * Required structure for where clause
 */
export type WhereClause<Where extends LogicalExpression = LogicalExpression> = {
  where: Where
}

/**
 * A filter for a column in some range
 */
export type BetweenFilter<
  Column extends ColumnReference = ColumnReference,
  Left extends ValueTypes = ValueTypes,
  Right extends ValueTypes = ValueTypes
> = {
  type: "BetweenFilter"
  column: Column
  left: Left
  right: Right
}

/**
 * A filter for an "IN" clause that can be either a set of values or a subquery
 */
export type InFilter<
  Column extends ColumnReference = ColumnReference,
  Values extends SubQuery | ValueTypes[] = SubQuery | ValueTypes[]
> = {
  type: "InFilter"
  column: Column
  values: Values
}

/**
 * A filter for a SubQuery operation
 */
export type SubqueryFilter<
  Column extends ColumnReference = ColumnReference,
  Operation extends string = SubQueryFilterOperation,
  Subquery extends SubQuery = SubQuery
> = {
  type: "SubqueryFilter"
  column: Column
  query: Subquery
  op: Operation
}
