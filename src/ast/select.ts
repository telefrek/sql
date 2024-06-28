import type { OneOrMore } from "../type-utils/common.js"
import type { ColumnReference } from "./columns.js"
import type { LogicalExpression } from "./filtering.js"
import type { NamedQuery } from "./named.js"
import type { TableReference } from "./tables.js"

/**
 * This is a helper type to instruct TypeScript to stop exploring the recursive
 * chains that come from FROM clauses allowing queries which can have selects,
 * completing a circular loop.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNamedQuery = NamedQuery<any>

/**
 * The supported join types
 */
export type JoinType = "LEFT" | "RIGHT" | "INNER" | "OUTER" | "LATERAL" | "FULL"

/**
 * Ways to combine two select queries
 */
export type CombinedSelectOperation = "UNION" | "INTERSECT" | "MINUS" | "EXCEPT"

/**
 * Allowed column orderings
 */
export type SortOrder = "ASCENDING" | "DESCENDING"

/**
 * Supported aggregation operations
 */
export type ColumnAggretator = "SUM" | "COUNT" | "AVG" | "MAX" | "MIN"

/**
 * An operation and additional select clause to apply
 */
export type CombinedSelect<
  Operation extends string = CombinedSelectOperation,
  Next extends SelectClause = SelectClause
> = {
  type: "CombinedSelect"
  op: Operation
  next: Next
}

/**
 * A join expression
 */
export type JoinExpression<
  Type extends JoinType = JoinType,
  From extends TableReference | NamedQuery = TableReference | NamedQuery,
  On extends LogicalExpression = LogicalExpression
> = {
  type: "JoinClause"
  joinType: Type
  from: From
  on: On
}

/**
 * Selected columns can be references or aggregates
 */
export type SelectedColumn = ColumnAggregate | ColumnReference

/**
 * The set of selected columns that will be returned
 */
export type SelectColumns = {
  [key: string]: SelectedColumn
}

/**
 * An aggregation on a column (ex: COUNT(id) AS `count`)
 */
export type ColumnAggregate<
  Column extends ColumnReference = ColumnReference,
  Aggretator extends string = ColumnAggretator,
  Alias extends string = string
> = {
  type: "ColumnAggregate"
  column: Column
  aggregator: Aggretator
  alias: Alias
}

/**
 * A column ordering expression
 */
export type ColumnOrdering<
  Column extends ColumnReference = ColumnReference,
  Order extends string = SortOrder
> = {
  type: "ColumnOrdering"
  column: Column
  order: Order
}

/**
 * Structure for a select clause
 */
export type SelectClause<
  Columns extends SelectColumns | "*" = SelectColumns | "*",
  From extends TableReference | AnyNamedQuery = TableReference | AnyNamedQuery
> = {
  type: "SelectClause"
  columns: Columns
  from: From
  distinct?: true
}

/**
 * A chain of select clauses
 */
export type CombinedSelectClause<
  Original extends SelectClause = SelectClause,
  Additions extends OneOrMore<CombinedSelect> = OneOrMore<CombinedSelect>
> = {
  type: "CombinedSelectClause"
  original: Original
  additions: Additions
}

/**
 * A join clause
 */
export type JoinClause<
  Join extends OneOrMore<JoinExpression> = OneOrMore<JoinExpression>
> = {
  join: Join
}

/**
 * Structure for a limit clause
 */
export type LimitClause<
  Offset extends number = number,
  Limit extends number = number
> = {
  offset: Offset
  limit: Limit
}

/**
 * Structure for a group by clause
 */
export type GroupByClause<
  GroupBy extends OneOrMore<ColumnReference> = OneOrMore<ColumnReference>
> = {
  groupBy: GroupBy
}

/**
 * Structure for an order by clause
 */
export type OrderByClause<
  OrderBy extends OneOrMore<ColumnOrdering> = OneOrMore<ColumnOrdering>
> = {
  orderBy: OrderBy
}

/**
 * Structure for a having clause
 */
export type HavingClause<Having extends LogicalExpression = LogicalExpression> =
  {
    having: Having
  }
