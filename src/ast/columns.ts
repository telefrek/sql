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
