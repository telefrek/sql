import type { SQLColumnSchema } from "./columns.js"
import type { ForeignKey, PrimaryKey } from "./keys.js"

/**
 * A table key
 */
export type SQLTableSchema<
  Schema extends SQLColumnSchema = SQLColumnSchema,
  Key extends PrimaryKey<Schema> = never
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: SQLTableSchema<any>
}

export type ForeignKeys = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: ForeignKey<any>
}

// TODO: We need to support views later based on queries of the table layout
/**
 * The entire database schema
 */
export type SQLDatabaseSchema<
  Tables extends SQLDatabaseTables = SQLDatabaseTables,
  Relations extends ForeignKeys = ForeignKeys
> = {
  tables: Tables
  relations: Relations
}
