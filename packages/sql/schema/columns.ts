import type { Flatten, IgnoreAny } from "@telefrek/type-utils/common.js"
import type {
  IncrementalSQLTypes,
  SQLBuiltinTypes,
  TSSQLType,
  VariableLengthSQLTypes,
  VariableNumericTypes,
} from "../types.js"

/**
 * Define a schema
 */
export type SQLColumnSchema = {
  [key: string]: ColumnTypeDefinition<IgnoreAny>
}

/**
 * The options for definitin a column
 */
export type SQLColumnOptions<T extends SQLBuiltinTypes = SQLBuiltinTypes> =
  Omit<ColumnTypeDefinition<T>, "type">

/**
 * The type information for a column
 */
export type ColumnTypeDefinition<T extends SQLBuiltinTypes = SQLBuiltinTypes> =
  Flatten<
    IncrementalType<T> &
      VariableLengthType<T> &
      BaseColumnDefinition<T> &
      VariableNumericType<T>
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
  IncrementalSQLTypes,
]
  ? { autoIncrement?: true }
  : object

/**
 * Extended information for variable size column types
 */
type VariableLengthType<T extends SQLBuiltinTypes> = [T] extends [
  VariableLengthSQLTypes,
]
  ? { size?: number }
  : object

/**
 * Extended information for variable numeric precision types
 */
type VariableNumericType<T extends SQLBuiltinTypes> = [T] extends [
  VariableNumericTypes,
]
  ? { precision?: number; scale?: number }
  : object
