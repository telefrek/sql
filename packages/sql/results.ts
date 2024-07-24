import type { Flatten, IgnoreAny } from "@telefrek/type-utils/common.js"
import type { StringKeys } from "@telefrek/type-utils/object"
import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "./ast/columns.js"
import type { QueryClause } from "./ast/queries.js"
import type { SelectClause } from "./ast/select.js"
import type { ColumnTypeDefinition } from "./schema/columns.js"
import type { SQLDatabaseTables } from "./schema/database.js"
import type { TSSQLType } from "./types.js"

/**
 * Extract the typescript type for a column
 */
type ColumnTSType<T extends ColumnTypeDefinition<IgnoreAny>> =
  T["array"] extends true ? TSSQLType<T["type"]>[] : TSSQLType<T["type"]>

/**
 * Extract the column reference data
 */
type GetColumn<
  Tables extends SQLDatabaseTables,
  Column extends ColumnReference,
> =
  Column extends ColumnReference<infer Reference, infer _Alias>
    ? Reference extends UnboundColumnReference<infer _Name>
      ? GetUnboundReference<
          Tables,
          Reference["column"],
          GetColumnTable<Tables, Reference["column"]>
        >
      : Reference extends TableColumnReference<infer Table, infer Name>
        ? [Table] extends [StringKeys<Tables>]
          ? ColumnTSType<Tables[Table]["columns"][Name]>
          : never
        : never
    : never

/**
 * Type to get an unbound table reference
 */
type GetUnboundReference<
  Tables extends SQLDatabaseTables,
  Column extends string,
  Table extends string,
> = [Table] extends [never]
  ? never
  : ColumnTSType<Tables[Table]["columns"][Column]>

/**
 * Type to find the table for an unbound column
 */
type GetColumnTable<Tables extends SQLDatabaseTables, Column extends string> = {
  [Table in keyof Tables]: [Column] extends [
    StringKeys<Tables[Table]["columns"]>,
  ]
    ? Table
    : never
}[StringKeys<Tables>]

/**
 * Flatten the column reference array into an object
 */
type GetColumnReferences<
  Tables extends SQLDatabaseTables,
  Columns,
> = Columns extends [infer Next extends ColumnReference, ...infer Rest]
  ? Rest extends never[]
    ? {
        [Key in Next["alias"]]: GetColumn<Tables, Next>
      }
    : Flatten<
        {
          [Key in Next["alias"]]: GetColumn<Tables, Next>
        } & GetColumnReferences<Tables, Rest>
      >
  : never

/**
 * Extract the shape of a row from a column schema
 */
export type SQLReturnRowType<
  Tables extends SQLDatabaseTables,
  Query extends QueryClause,
> =
  Query extends SelectClause<infer Columns, infer From>
    ? Columns extends "*"
      ? [From["alias"]] extends [StringKeys<Tables>]
        ? {
            [Column in StringKeys<
              Tables[From["alias"]]["columns"]
            >]: ColumnTSType<Tables[From["alias"]]["columns"][Column]>
          }
        : never
      : GetColumnReferences<Tables, Columns>
    : never
