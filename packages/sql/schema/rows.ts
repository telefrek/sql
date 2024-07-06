import type { Flatten, IgnoreAny } from "@telefrek/type-utils/common.js"
import type { TSSQLType } from "../types.js"
import type { ColumnTypeDefinition, SQLColumnSchema } from "./columns.js"
import type { SQLTableSchema } from "./database.js"

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
 * Extract the typescript type for a column
 */
export type ColumnTSType<T extends ColumnTypeDefinition<IgnoreAny>> =
  T["array"] extends true ? TSSQLType<T["type"]>[] : TSSQLType<T["type"]>

/**
 * Type to extract the required keys of a schema which are values that are not
 * nullable, have an auto-increment or a defined default value
 */
type RequiredKeys<T extends SQLColumnSchema> = {
  [K in keyof T]: T[K]["nullable"] extends true
    ? never
    : T[K]["autoIncrement"] extends true
      ? never
      : T[K]["default"] extends [never]
        ? K
        : never
}[keyof T]

/**
 * Type to extract the nullable (optional) keys of a schema
 */
export type NullableKeys<T extends SQLColumnSchema> = {
  [K in keyof T]: [K] extends [RequiredKeys<T>] ? never : K
}[keyof T]
