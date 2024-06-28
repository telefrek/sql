import type { OneOrMore } from "../type-utils/common.js"
import type { ColumnReference, TableColumnReference } from "./columns.js"
import type { CombinedSelectClause } from "./combined.js"
import type { SelectClause } from "./select.js"
import type { TableReference } from "./tables.js"
import type { UpdateClause } from "./update.js"
import type { ValueTypes } from "./values.js"

/**
 * Structure for a generic SQL Query
 */
export type SQLQuery<Query extends QueryClause = QueryClause> = {
  type: "SQLQuery"
  query: Query
}

/**
 * Structure for a simple query clause
 */
export type QueryClause =
  | SelectClause
  | UpdateClause
  | DeleteClause
  | InsertClause
  | CombinedSelectClause

/**
 * A query clause that returns a shaped row
 */
export type RowGeneratingClause =
  | SelectClause
  | CombinedSelectClause
  | ReturningClause

/**
 * Structure of a subquery
 */
export type SubQuery<Query extends QueryClause = QueryClause> = {
  type: "SubQuery"
  query: Query
}

/**
 * Structure for a returning clause
 */
export type ReturningClause<
  Returning extends OneOrMore<TableColumnReference> = OneOrMore<TableColumnReference>
> = {
  returning: Returning
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
  Columns extends OneOrMore<ColumnReference> = OneOrMore<ColumnReference>,
  Values extends OneOrMore<ValueTypes> | RowGeneratingClause =
    | OneOrMore<ValueTypes>
    | RowGeneratingClause
> = {
  type: "InsertClause"
  table: Table
  columns: Columns
  values: Values
}
