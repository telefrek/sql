import type { AddKVToType } from "@telefrek/type-utils/common.js"
import type { SQLColumnSchema } from "./columns.js"
import type { SQLDatabaseTables, SQLTableSchema } from "./database.js"

/**
 * Utility type to add a table to a schema
 */
export type AddTableToSchema<
  Table extends string,
  Schema extends SQLColumnSchema,
  Tables extends SQLDatabaseTables
> = AddKVToType<
  Tables,
  Table,
  SQLTableSchema<Schema>
> extends infer T extends SQLDatabaseTables
  ? T
  : never
