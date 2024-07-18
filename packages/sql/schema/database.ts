import type { IgnoreAny } from "@telefrek/type-utils/common.js"
import type { SQLColumnSchema } from "./columns.js"
import type { ForeignKey, PrimaryKey } from "./keys.js"

/**
 * A table key
 */
export type SQLTableSchema<
  Schema extends SQLColumnSchema = SQLColumnSchema,
  Key extends PrimaryKey<Schema> = never,
> = [Key] extends [never]
  ? {
      columns: Schema
    }
  : {
      columns: Schema
      primaryKey: Key
    }

/**
 * The set of database tables
 */
export type SQLDatabaseTables = {
  [key: string]: SQLTableSchema<IgnoreAny>
}

export type ForeignKeys = {
  [key: string]: ForeignKey<IgnoreAny>
}

// TODO: We need to support views later based on queries of the table layout
/**
 * The entire database schema
 */
export type SQLDatabaseSchema<
  Tables extends SQLDatabaseTables = SQLDatabaseTables,
  Relations extends ForeignKeys = ForeignKeys,
> = {
  tables: Tables
  relations: Relations
}
