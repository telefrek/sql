import type { Flatten } from "@telefrek/type-utils/common.js"
import type { SQLColumnSchema } from "./columns.js"
import type { SQLDatabaseTables, SQLTableSchema } from "./database.js"

/**
 * Utility type to add a table to a schema
 */
export type AddTableToSchema<
  Table extends string,
  Schema extends SQLColumnSchema,
  Tables extends SQLDatabaseTables,
> = CheckSQLTables<
  Flatten<
    Tables & {
      [Key in Table]: SQLTableSchema<Schema>
    }
  >
>

/**
 * Utility type to verify T is a SQLDatabaseTables object
 */
type CheckSQLTables<T> = T extends SQLDatabaseTables ? T : never
