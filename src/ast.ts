/**
 * The building blocks for our SQL AST structure
 */

/**
 * The set of value types supported
 */
export type ValueTypes =
  | BooleanValueType
  | NumberValueType
  | BigIntValueType
  | BufferValueType
  | StringValueType
  | JsonValueType
  | ArrayValueType
  | NullValueType
  | ParameterValueType
  | ColumnReference

/**
 * A parameter that is passed into the query at runtime
 */
export type ParameterValueType<Name extends string = string> = {
  type: "ParameterValue"
  name: Name
}

/**
 * A {@link boolean} value
 */
export type BooleanValueType<B extends boolean = boolean> = {
  type: "BooleanValue"
  value: B
}

/**
 * A {@link number} value
 */
export type NumberValueType<N extends number = number> = {
  type: "NumberValue"
  value: N
}

/**
 * A {@link bigint} value
 */
export type BigIntValueType<B extends number | bigint = bigint> = {
  type: "BigIntValue"
  value: B
}

/**
 * A {@link Int8Array} value
 */
export type BufferValueType<B extends Int8Array = Int8Array> = {
  type: "BufferValue"
  value: B
}

/**
 * A {@link string} value
 */
export type StringValueType<S extends string = string> = {
  type: "StringValue"
  value: S
}

/**
 * An explicit `null` reference
 */
export type NullValueType = {
  type: "NullValue"
  value: null
}

/**
 * A JSON value
 */
export type JsonValueType<J extends object = object> = {
  type: "JsonValue"
  value: J
}

/**
 * An array value
 */
export type ArrayValueType<A extends unknown[] = unknown[]> = {
  type: "ArrayValue"
  value: A
}

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
 * Operation to modify a value
 */
export type ArithmeticOperation =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "&"
  | "|"
  | "^"
  | "+="
  | "-="
  | "*="
  | "/="
  | "%="
  | "&="

/**
 * Structure of a subquery
 */
export type SubQuery<Query extends SQLQuery = SQLQuery> = {
  type: "SubQuery"
  query: Query
}

/**
 * A filter between two objects
 */
export type ColumnFilter<
  Left extends ColumnReference<
    TableColumnReference | UnboundColumnReference
  > = ColumnReference<TableColumnReference | UnboundColumnReference>,
  Operation extends FilteringOperation = FilteringOperation,
  Right extends ValueTypes = ValueTypes
> = {
  type: "ColumnFilter"
  left: Left
  op: Operation
  right: Right
}

/**
 * Types of subquery filtering mechanisms
 */
export type SubQueryFilterOperation = "IN" | "ANY" | "ALL" | "EXISTS" | "SOME"

/**
 * The IN filter definition
 */
export type SubqueryFilter<
  Column extends ColumnReference = ColumnReference,
  Subquery extends SubQuery = SubQuery,
  Op extends SubQueryFilterOperation = SubQueryFilterOperation
> = {
  type: "SubqueryFilter"
  column: Column
  query: Subquery
  op: Op
}

/**
 * Types for building logical trees
 */
export type LogicalOperation = "AND" | "OR" | "NOT"

/**
 * A logical tree structure for processing groups of filters
 */
export type LogicalTree<
  Left extends LogicalExpression = LogicalExpression,
  Operation extends LogicalOperation = LogicalOperation,
  Right extends LogicalExpression = LogicalExpression
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | LogicalTree<any, LogicalOperation, any>
  | ColumnFilter
  | SubqueryFilter

/**
 * A Column that we don't know the ownership of
 */
export type UnboundColumnReference<Column extends string = string> = {
  type: "UnboundColumnReference"
  column: Column
}

/**
 * A column with an identified table
 */
export type TableColumnReference<
  Table extends string = string,
  Column extends string = string
> = {
  type: "TableColumnReference"
  table: Table
  column: Column
}

/**
 * A reference (bound or unbound) to a column
 */
export type ColumnReference<
  Reference extends UnboundColumnReference | TableColumnReference =
    | UnboundColumnReference
    | TableColumnReference,
  Alias extends string = Reference["column"]
> = {
  type: "ColumnReference"
  reference: Reference
  alias: Alias
}

/**
 * Supported aggregation operations
 */
export type ColumnAggregateOperation = "SUM" | "COUNT" | "AVG" | "MAX" | "MIN"

/**
 * An aggregation on a column (ex: COUNT(id) AS `count`)
 */
export type ColumnAggregate<
  Column extends ColumnReference = ColumnReference,
  Aggregate extends ColumnAggregateOperation = ColumnAggregateOperation,
  Alias extends string = string
> = {
  type: "ColumnAggregate"
  column: Column
  aggregate: Aggregate
  alias: Alias
}

/**
 * A reference to a table
 */
export type TableReference<
  Table extends string = string,
  Alias extends string = Table
> = {
  type: "TableReference"
  table: Table
  alias: Alias
}

/**
 * The supported join types
 */
export type JoinType = "LEFT" | "RIGHT" | "INNER" | "OUTER" | "LATERAL" | "FULL"

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
 * A join clause
 */
export type JoinClause<
  Join extends JoinExpression | JoinExpression[] =
    | JoinExpression
    | JoinExpression[]
> = {
  join: Join
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
 * Structure for a select clause
 */
export type SelectClause<
  Columns extends SelectColumns | "*" = SelectColumns | "*",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  From extends TableReference | NamedQuery<any> =
    | TableReference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | NamedQuery<any>
> = {
  type: "SelectClause"
  columns: Columns
  from: From
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
 * Required structure for where clause
 */
export type WhereClause<Where extends LogicalExpression = LogicalExpression> = {
  where: Where
}

/**
 * Structure for a group by clause
 */
export type GroupByClause<
  GroupBy extends ColumnReference[] = ColumnReference[]
> = {
  groupBy: GroupBy
}

/**
 * Allowed column orderings
 */
export type Order = "ASCENDING" | "DESCENDING"

/**
 * A column ordering expression
 */
export type ColumnOrdering<
  Column extends ColumnReference = ColumnReference,
  Direction extends Order = "ASCENDING"
> = {
  type: "ColumnOrdering"
  column: Column
  order: Direction
}

/**
 * Structure for an order by clause
 */
export type OrderByClause<OrderBy extends ColumnOrdering[] = ColumnOrdering[]> =
  {
    orderBy: OrderBy
  }

/**
 * Structure for a having clause
 */
export type HavingClause<Having extends LogicalExpression = LogicalExpression> =
  {
    having: Having
  }

/**
 * Updates can modify columns
 */
export type ColumnAssignment<
  Column extends ColumnReference = ColumnReference,
  Value extends ValueTypes = ValueTypes
> = {
  type: "ColumnAssignment"
  column: Column
  value: Value
}

/**
 * Structure for a returning clause
 */
export type ReturningClause<
  Returning extends TableColumnReference[] = TableColumnReference[]
> = {
  returning: Returning
}

/**
 * Structure for an update clause
 */
export type UpdateClause<
  Table extends TableReference = TableReference,
  Columns extends ColumnAssignment[] = ColumnAssignment[]
> = {
  type: "UpdateClause"
  columns: Columns
  table: Table
}

/**
 * Structure for a delete clause
 */
export type DeleteClause<Table extends TableReference = TableReference> = {
  type: "DeleteClause"
  table: Table
}

/**
 * Structure for an insert clause
 */
export type InsertClause<
  Table extends TableReference = TableReference,
  Columns extends ColumnReference[] = ColumnReference[],
  Values extends ValueTypes[] | SelectClause = ValueTypes[]
> = {
  type: "InsertClause"
  table: Table
  columns: Columns
  values: Values
}

/**
 * A named query
 */
export type NamedQuery<
  Query extends SQLQuery = SQLQuery,
  Alias extends string = string
> = {
  type: "NamedQuery"
  query: Query
  alias: Alias
}

/**
 * Ways to combine two queries
 */
export type CombineOperation = "UNION" | "INTERSECT" | "MINUS" | "EXCEPT"

/**
 * An operation and additional select clause to apply
 */
export type CombinedQuery<
  Operation extends CombineOperation = CombineOperation,
  Next extends SelectClause = SelectClause
> = {
  type: "CombinedQuery"
  op: Operation
  next: Next
}

/**
 * A chain of select clauses
 */
export type CombinedQueryClause<
  Original extends SelectClause = SelectClause,
  Additions extends CombinedQuery[] = CombinedQuery[]
> = {
  type: "CombinedQueryClause"
  original: Original
  additions: Additions
}

/**
 * Structure for a with clause
 */
export type WithClause<
  With extends NamedQuery | NamedQuery[] = NamedQuery | NamedQuery[]
> = {
  with: With
}

/**
 * Structure for a simple query clause
 */
export type QueryClause =
  | SelectClause
  | UpdateClause
  | DeleteClause
  | InsertClause

/**
 * Structure for a generic SQL Query
 */
export type SQLQuery<
  Query extends QueryClause | CombinedQueryClause =
    | QueryClause
    | CombinedQueryClause
> = {
  type: "SQLQuery"
  query: Query
}
