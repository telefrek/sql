import type { IgnoreAny } from "@telefrek/type-utils/common.js"
import type { ColumnReference } from "./columns.js"
import type { SubQuery } from "./queries.js"
import type { ValueTypes } from "./values.js"

/**
 * Types for building filtering trees
 */
export type FilteringOperation =
  | "="
  | "<"
  | ">"
  | "<="
  | ">="
  | "!="
  | "<>"
  | "LIKE"
  | "ILIKE"

/**
 * The default filtering operations
 */
export const DEFAULT_FILTER_OPS: FilteringOperation[] = [
  "=",
  "<",
  ">",
  "<=",
  ">=",
  "!=",
  "<>",
  "LIKE",
  "ILIKE",
]

/**
 * Types of subquery filtering mechanisms
 */
export type SubQueryFilterOperation = "IN" | "ANY" | "ALL" | "EXISTS" | "SOME"

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
 * The IN filter definition
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
  Left extends ColumnReference = ColumnReference,
  Operation extends string = FilteringOperation,
  Right extends ValueTypes | ColumnReference = ValueTypes | ColumnReference
> = {
  type: "ColumnFilter"
  left: Left
  op: Operation
  right: Right
}

/**
 * Required structure for where clause
 */
export type WhereClause<Where extends LogicalExpression = LogicalExpression> = {
  where: Where
}
