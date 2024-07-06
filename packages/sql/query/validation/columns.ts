import type { Invalid } from "@telefrek/type-utils/common.js"
import type { StringKeys } from "@telefrek/type-utils/object.js"
import type { UnionToTuple } from "@telefrek/type-utils/unsafe.js"
import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "../../ast/columns.js"
import type {
  ColumnAggregate,
  SelectColumns,
  SelectedColumn,
} from "../../ast/select.js"
import type { SQLDatabaseTables } from "../../schema/database.js"

/**
 * Ensure that the select columns are valid
 */
export type ValidateSelectColumns<
  Active extends SQLDatabaseTables,
  Columns extends SelectColumns | "*"
> = Columns extends "*"
  ? true
  : Columns extends SelectColumns
  ? ValidateSelectedColumns<Active, ExtractSelectedColumns<Columns>>
  : Invalid<"Invalid selected columns">

/**
 * Extract the column references from the columns
 */
type ValidateSelectedColumns<
  Active extends SQLDatabaseTables,
  Columns
> = Columns extends [infer Column extends SelectedColumn, ...infer Rest]
  ? Rest extends never[]
    ? GetColumnReference<Column> extends ColumnReference<
        infer Reference,
        infer _Alias
      >
      ? ColumnInActive<Active, Reference>
      : Invalid<`Invalid or corrupt column reference`>
    : GetColumnReference<Column> extends ColumnReference<
        infer Reference,
        infer _Alias
      >
    ? ColumnInActive<Active, Reference> extends true
      ? ValidateSelectedColumns<Active, Rest>
      : ColumnInActive<Active, Reference>
    : Invalid<`Invalid or corrupt column reference`>
  : Invalid<"Columns are not valid SelectedColumn[]">

/**
 * Extract the column reference from the SelectColumn property
 */
type GetColumnReference<Selected extends SelectedColumn> =
  Selected extends ColumnReference<infer Reference, infer _Alias>
    ? ColumnReference<Reference>
    : Selected extends ColumnAggregate<
        infer Reference,
        infer _Agg,
        infer _Alias
      >
    ? Reference
    : never

// TODO: When we allow more tables via joins, this needs to ensure that unbound
// columns are part of the unique column set...

/**
 * Verify that the column is part of the active set since don't want people
 * pulling columns from tables that aren't part of the select clause
 */
type ColumnInActive<
  Active extends SQLDatabaseTables,
  Column extends UnboundColumnReference | TableColumnReference
> = Column extends TableColumnReference<infer Table, infer Col>
  ? [Col] extends [StringKeys<Active[Table]["columns"]>]
    ? true
    : Invalid<`${Col} is not a column of ${Table}`>
  : [Column["column"]] extends [
      {
        [Table in keyof Active]: StringKeys<Active[Table]["columns"]>
      }[keyof Active]
    ]
  ? true
  : Invalid<`${Column["column"]} is not a valid column`>

/**
 * Extract the selected column properties as an array instead of a union
 *
 * NOTE: There is NO guarantee on the order these come back but that shouldn't
 * matter for validation purposes...
 */
export type ExtractSelectedColumns<Columns extends SelectColumns> =
  UnionToTuple<
    {
      [Key in StringKeys<Columns>]: Columns[Key]
    }[StringKeys<Columns>]
  >
