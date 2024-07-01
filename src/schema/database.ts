import type { StringKeys } from "../type-utils/object.js"
import type { SQLColumnSchema } from "./columns.js"
import type { ForeignKey, PrimaryKey } from "./keys.js"

/**
 * Helper type for getting keys from the schema
 */
export type DatabaseTables<Schema extends SQLDatabaseSchema> = StringKeys<
  Schema["tables"]
>

/**
 * Helper type for getting the columns from a schema table
 */
export type DatabaseTableColumns<
  Schema extends SQLDatabaseSchema,
  Table extends DatabaseTables<Schema>
> = StringKeys<Schema["tables"][Table]["columns"]>

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
  [key: string]: SQLTableSchema
}

// TODO: We need to support views later based on queries of the table layout
/**
 * The entire database schema
 */
export type SQLDatabaseSchema<
  Tables extends SQLDatabaseTables = SQLDatabaseTables,
  Relations extends ForeignKey[] = ForeignKey[]
> = {
  tables: Tables
  relations: Relations
}
