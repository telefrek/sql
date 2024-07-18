import type { Invalid } from "@telefrek/type-utils/common.js"
import type { ColumnReference } from "./columns.js"
import type { SubQuery } from "./queries.js"
import type { ValueTypes } from "./values.js"

/**
 * This is a helper type to instruct TypeScript to stop exploring the recursive
 * chains that come from expression trees that are nested by nature.  Since a
 * LogicalExpression an contain a LogicalTree, it creates a circular type which
 * we need to avoid.  This simply tells TypeScript to leave it alone and we'll
 * have to deal with the potential for bad data via our ValidateLogicalTree type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLogicalTree = LogicalTree<any, string, any>

/**
 * Utility type to verify a LogicalTree doesn't have invalid data
 */
export type ValidateLogicalTree<Tree> =
  Tree extends LogicalTree<infer Left, infer Op, infer Right>
    ? LogicalTree<Left, Op, Right>
    : Invalid<"Tree is not a LogicalTree">

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
 * Types of subquery filtering mechanisms
 */
export type SubQueryFilterOperation = "IN" | "ANY" | "ALL" | "EXISTS" | "SOME"

/**
 * Types for building logical trees
 */
export type LogicalOperation = "AND" | "OR" | "NOT"

/**
 * The IN filter definition
 */
export type SubqueryFilter<
  Column extends ColumnReference = ColumnReference,
  Operation extends string = SubQueryFilterOperation,
  Subquery extends SubQuery = SubQuery,
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
  Operation extends string = LogicalOperation,
  Right extends LogicalExpression = LogicalExpression,
> = {
  type: "LogicalTree"
  left: Left
  op: Operation
  right: Right
}

/**
 * The valid types for building a logical expression tree
 */
export type LogicalExpression =
  | ValueTypes
  | AnyLogicalTree
  | ColumnFilter
  | SubqueryFilter

/**
 * A filter between two objects
 */
export type ColumnFilter<
  Left extends ColumnReference = ColumnReference,
  Operation extends string = FilteringOperation,
  Right extends ValueTypes | ColumnReference = ValueTypes | ColumnReference,
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
