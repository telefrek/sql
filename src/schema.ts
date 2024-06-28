import type { Flatten } from "./type-utils/common.js"
import type {
  IncrementalSQLTypes,
  SQLBuiltinTypes,
  TSSQLType,
  VariableSQLTypes,
} from "./types.js"

/**
 * Define a schema
 */
export type SQLColumnSchema = {
  [key: string]: ColumnTypeDefinition
}

/**
 * Basic table definition with columns
 */
export type SQLTableSchema<Schema extends SQLColumnSchema = SQLColumnSchema> = {
  columns: Schema
}

/**
 * A table key
 */
export type SQLTableKey<
  Schema extends SQLColumnSchema = SQLColumnSchema,
  PK = never
> = Flatten<
  SQLTableSchema<Schema> & {
    primaryKey: PK extends PrimaryKey<infer K>
      ? PrimaryKey<K>
      : PK extends CompositePrimaryKey<infer K>
      ? CompositePrimaryKey<K>
      : never
  }
>

/**
 * The set of database tables
 */
export type SQLDatabaseTables = {
  [key: string]: SQLTableSchema
}

/**
 * The entire database schema
 *
 * @template Tables The SQLDatabaseTables that exist
 * @template Relations The ForeignKeys that exist
 */
export type SQLDatabaseSchema<
  Tables extends SQLDatabaseTables = SQLDatabaseTables,
  Relations extends ForeignKey[] = ForeignKey[]
> = {
  tables: Tables
  relations: Relations
}

/**
 * The type information for a column
 *
 * @template T The SQLBuiltinType for the column
 */
export type ColumnTypeDefinition<T = SQLBuiltinTypes> = [T] extends [
  SQLBuiltinTypes
]
  ? Flatten<IncrementalType<T> & VariableType<T> & BaseColumnDefinition<T>>
  : never

/**
 * A primary key
 *
 * @template Column The column that is the key
 */
export type PrimaryKey<Column> = {
  column: Column
}

/**
 * A composite primary key
 *
 * @template Columns The columns in order that are the key
 */
export type CompositePrimaryKey<Columns extends unknown[]> = {
  columns: Columns
}

/**
 * A foreign key between two tables
 *
 * @template Left The left table of the foreign key
 * @template Right The right table of the foreign key
 * @template LeftColumn The column in the left table which is the source
 * @template RightColumn The column in the right table which is the value
 */
export type ForeignKey<
  Left extends SQLColumnSchema = SQLColumnSchema,
  Right extends SQLColumnSchema = SQLColumnSchema,
  LeftColumn extends keyof Left = keyof Left,
  RightColumn extends keyof Right = keyof Right
> = {
  left: Left
  right: Right
  leftColumn: LeftColumn
  rightColumn: RightColumn
}

/**
 * The options for definitin a column
 *
 * @template T The SQLBuiltinType for the column
 */
export type SQLColumnOptions<T extends SQLBuiltinTypes> = Flatten<
  BaseColumnOptions & IncrementalType<T> & VariableType<T>
>

/**
 * The base column types
 */
type BaseColumnOptions = {
  array?: true
  nullable?: true
}

/**
 * Extract the typescript type for a column
 */
export type ColumnTSType<T extends ColumnTypeDefinition> =
  T["array"] extends true ? TSSQLType<T["type"]>[] : TSSQLType<T["type"]>

/**
 * Extract the shape of a row from a table
 */
export type SQLTableRow<T extends SQLTableSchema> = SQLRow<T["columns"]>

/**
 * Extract the shape of a row from a column schema
 */
export type SQLRow<T extends SQLColumnSchema> = Flatten<
  {
    [K in RequiredKeys<T>]: ColumnTSType<T[K]>
  } & {
    [K in NullableKeys<T>]?: ColumnTSType<T[K]>
  }
>

/**
 * Type to extract the required keys of a schema
 */
type RequiredKeys<T extends SQLColumnSchema> = {
  [K in keyof T]: T[K]["nullable"] extends true ? never : K
}[keyof T]

/**
 * Type to extract the nullable (optional) keys of a schema
 */
export type NullableKeys<T extends SQLColumnSchema> = {
  [K in keyof T]: T[K]["nullable"] extends true ? K : never
}[keyof T]

/**
 * A base type for all SQL Columns
 */
type BaseColumnDefinition<T extends SQLBuiltinTypes> = {
  type: T
  array?: true
  nullable?: true
}

/**
 * Extended information for incremental column types
 */
type IncrementalType<T extends SQLBuiltinTypes> = [T] extends [
  IncrementalSQLTypes
]
  ? { autoIncrement?: true }
  : object

/**
 * Extended information for variable size column types
 */
type VariableType<T extends SQLBuiltinTypes> = [T] extends [VariableSQLTypes]
  ? { size?: number }
  : object
