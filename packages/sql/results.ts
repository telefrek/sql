import type {
  Flatten,
  IgnoreAny,
  IgnoreEmpty,
} from "@telefrek/type-utils/common.js"
import type { StringKeys } from "@telefrek/type-utils/object"
import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "./ast/columns.js"
import type { QueryClause, SQLQuery } from "./ast/queries.js"
import type { SelectClause } from "./ast/select.js"
import type { ColumnTypeDefinition } from "./schema/columns.js"
import type { SQLDatabaseTables } from "./schema/database.js"
import type { TSSQLType } from "./types.js"

/**
 * Extract the typescript type for a column
 */
type ColumnTSType<T extends ColumnTypeDefinition<IgnoreAny>> =
  T["array"] extends true ? TSSQLType<T["type"]>[] : TSSQLType<T["type"]>

type GetColumn<
  Tables extends SQLDatabaseTables,
  Column extends ColumnReference,
> =
  Column extends ColumnReference<infer Reference>
    ? Reference extends UnboundColumnReference<infer _Name>
      ? never
      : Reference extends TableColumnReference<infer Table, infer Name>
        ? [Table] extends [StringKeys<Tables>]
          ? ColumnTSType<Tables[Table]["columns"][Name]>
          : never
        : never
    : never

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

export type BuildActive<
  Database extends SQLDatabaseTables,
  Query extends SQLQuery,
> =
  Query extends SQLQuery<infer QueryType>
    ? QueryType extends SelectClause<infer _, infer From>
      ? {
          [Key in From["alias"]]: Database[From["alias"]]
        }
      : IgnoreEmpty
    : IgnoreEmpty

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
