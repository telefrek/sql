import type { Flatten } from "../type-utils/common.js"
import type { StringKeys } from "../type-utils/object.js"
import type {
  IncrementalSQLTypes,
  SQLBuiltinTypes,
  TSSQLType,
  VariableSQLTypes,
} from "../types.js"

/**
 * This utility type is required for inferring the types of columns when doing
 * type narrorwing or infer extends SQLColumnSchema as examples
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyColumnType = ColumnTypeDefinition<any>

/**
 * Retrieve the valid set of keys where the column types match and there are no
 * potentially error prone definitions (like nullable) where keys wouldn't work
 */
export type ValidForeignKeyTargets<
  Source extends SQLColumnSchema,
  SourceColumn extends StringKeys<Source>,
  Destination extends SQLColumnSchema
> = {
  [K in StringKeys<Destination>]: Destination[K]["nullable"] extends true
    ? never
    : TSSQLType<Destination[K]["type"]> extends TSSQLType<
        Source[SourceColumn]["type"]
      >
    ? K
    : never
}[StringKeys<Destination>]

/**
 * Define a schema
 */
export type SQLColumnSchema = {
  [key: string]: AnyColumnType
}

/**
 * The options for definitin a column
 */
export type SQLColumnOptions<T extends SQLBuiltinTypes> = Omit<
  ColumnTypeDefinition<T>,
  "type"
>

/**
 * The type information for a column
 */
export type ColumnTypeDefinition<T extends SQLBuiltinTypes> = Flatten<
  IncrementalType<T> & VariableType<T> & BaseColumnDefinition<T>
>

/**
 * A value or provider of a value
 */
export type DefaultValueProvider<T extends SQLBuiltinTypes> =
  | TSSQLType<T>
  | (() => TSSQLType<T>)

/**
 * A base type for all SQL Columns
 */
type BaseColumnDefinition<T extends SQLBuiltinTypes> = {
  type: T
  array?: true
  nullable?: true
  unique?: true
  default?: DefaultValueProvider<T>
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
