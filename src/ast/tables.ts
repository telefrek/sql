/**
 * A reference to a table
 */
export type TableReference<
  Table extends string = string,
  Alias extends string = Table,
> = {
  type: "TableReference"
  table: Table
  alias: Alias
}
