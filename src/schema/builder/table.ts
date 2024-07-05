import type { Flatten, IgnoreEmpty } from "../../type-utils/common.js"
import type {
  CheckDuplicateKey,
  RequiredLiteralKeys,
  RequiredSubset,
  StringKeys,
} from "../../type-utils/object.js"
import type { SQLBuiltinTypes } from "../../types.js"
import type {
  ColumnTypeDefinition,
  SQLColumnOptions,
  SQLColumnSchema,
} from "../columns.js"
import type { SQLTableSchema } from "../database.js"
import type { CompositeKey, PrimaryKey, SingleKey } from "../keys.js"

/**
 * An empty SQLTableSchema
 */
type EmptyTableSchema = SQLTableSchema<IgnoreEmpty>

/**
 * Utility type to add the key to the table schema
 */
type AddKeyToTable<Table extends SQLTableSchema, Column> = SQLTableSchema<
  Table["columns"],
  Column extends (infer T extends StringKeys<Table["columns"]>)[]
    ? Column["length"] extends 1
      ? SingleKey<Table["columns"], T>
      : CompositeKey<Table["columns"], Column>
    : Column extends StringKeys<Table["columns"]>
      ? SingleKey<Table["columns"], Column>
      : never
>

/**
 * Type to collapse the column definition based on the optional keys
 *
 * @template T The type of the column
 * @template K The keys from the options
 */
type FinalColumnDefinition<
  T extends SQLBuiltinTypes,
  K extends keyof SQLColumnOptions<T>,
> = Flatten<
  RequiredLiteralKeys<ColumnTypeDefinition<T>> &
    RequiredSubset<SQLColumnOptions<T>, K>
>

/**
 * Verify the type is a valid SQLColumnSchema
 */
type CheckColumnSchema<T> = T extends SQLColumnSchema ? T : never

/**
 * Utility type to add a column to a schema
 */
type AddColumnToSchema<
  Columns extends SQLColumnSchema,
  Column extends string,
  ColumnType extends SQLBuiltinTypes,
  Options extends keyof SQLColumnOptions<ColumnType>,
> = CheckColumnSchema<
  Flatten<
    Columns & {
      [key in Column]: FinalColumnDefinition<ColumnType, Options>
    }
  >
>

/**
 * Utility type to add a column to a SQLTableSchema by successively inferring
 * additional type information from the SQLTableSchema to preserve keys.
 */
type AddColumnToTableSchema<
  Schema extends SQLTableSchema,
  Column extends string,
  ColumnType extends SQLBuiltinTypes,
  Options extends keyof SQLColumnOptions<ColumnType>,
> =
  Schema extends SQLTableSchema<infer Columns>
    ? Schema extends SQLTableSchema<
        Columns,
        infer Key extends PrimaryKey<Columns>
      >
      ? SQLTableSchema<
          AddColumnToSchema<Columns, Column, ColumnType, Options>,
          Key
        >
      : SQLTableSchema<AddColumnToSchema<Columns, Column, ColumnType, Options>>
    : never

/**
 * Define a SQLColumn definition
 *
 * @param type The column type
 * @param options The SQLColumnOptions
 * @returns A ColumnType definition with limited schema information
 */
function SQLColumn<
  ColumnType extends SQLBuiltinTypes,
  Options extends keyof SQLColumnOptions<ColumnType> = never,
>(
  type: ColumnType,
  options?: RequiredSubset<SQLColumnOptions<ColumnType>, Options>,
): FinalColumnDefinition<ColumnType, Options> {
  return {
    ...options,
    type,
  } as unknown as FinalColumnDefinition<ColumnType, Options>
}

/**
 * Create a {@link ColumnSchemaBuilder} for the given schema or start with an
 * empty one
 *
 * @param current The optional current schema
 * @returns A {@link ColumnSchemaBuilder} to manipulate the schema
 */
export function createColumnSchemaBuilder<
  Schema extends SQLColumnSchema = IgnoreEmpty,
>(current?: Schema): ColumnSchemaBuilder<Schema> {
  return new SQLColumnSchemaBuilder<Schema>(current ?? ({} as Schema))
}

/**
 * A schema builder
 */
export type ColumnSchemaBuilderFn<
  Schema extends SQLColumnSchema,
  Result extends SQLColumnSchema,
> = (original: ColumnSchemaBuilder<Schema>) => ColumnSchemaBuilder<Result>

/**
 * Create a {@link TableSchemaBuilder} for the given schema or start with an
 * empty one
 *
 * @param current The optional current schema
 * @returns A {@link TableSchemaBuilder} to manipulate the table
 */
export function createTableSchemaBuilder<
  Schema extends SQLTableSchema = EmptyTableSchema,
>(current?: Schema): TableSchemaBuilder<Schema> {
  if (current !== undefined) {
    return "primaryKey" in current
      ? new SQLTableSchemaBuilder(current.columns, current["primaryKey"])
      : new SQLTableSchemaBuilder(current.columns)
  }

  return new SQLTableSchemaBuilder({})
}

/**
 * An object that provides a ColumnSchema
 */
export interface ColumnSchemaBuilder<Schema extends SQLColumnSchema> {
  readonly columns: Schema

  /**
   * Add a column to the schema with the given type and options
   *
   * @param column The column to add
   * @param type The column type
   * @param options The additional properties to specify
   */
  addColumn<
    Column extends string,
    ColumnType extends SQLBuiltinTypes,
    Options extends keyof SQLColumnOptions<ColumnType> = never,
  >(
    column: CheckDuplicateKey<Column, Schema>,
    type: ColumnType,
    options?: RequiredSubset<SQLColumnOptions<ColumnType>, Options>,
  ): ColumnSchemaBuilder<AddColumnToSchema<Schema, Column, ColumnType, Options>>
}

/**
 * An object that provides a SQLTableSchema
 */
export interface TableSchemaBuilder<
  Schema extends SQLTableSchema = EmptyTableSchema,
> {
  readonly table: Schema

  /**
   * Add a key to the table with the given columns
   *
   * @param columns The key columns in order
   */
  withKey<Column extends StringKeys<Schema["columns"]>[]>(
    ...columns: Column
  ): AddKeyToTable<Schema, Column>

  /**
   * Add a column to the schema with the given type and options
   *
   * @param column The column to add
   * @param type The column type
   * @param options The additional properties to specify
   */
  addColumn<
    Column extends string,
    ColumnType extends SQLBuiltinTypes,
    Options extends keyof SQLColumnOptions<ColumnType> = never,
  >(
    column: CheckDuplicateKey<Column, Schema["columns"]>,
    type: ColumnType,
    options?: RequiredSubset<SQLColumnOptions<ColumnType>, Options>,
  ): TableSchemaBuilder<
    AddColumnToTableSchema<Schema, Column, ColumnType, Options>
  >
}

/**
 * Implementation of the {@link ColumnSchemaBuilder} that manipulates unknown objects
 */
class SQLColumnSchemaBuilder<Schema extends SQLColumnSchema>
  implements ColumnSchemaBuilder<Schema>
{
  private _columns: unknown

  constructor(columns: Schema) {
    this._columns = columns
  }

  get columns(): Schema {
    return this._columns as Schema
  }

  addColumn<
    Column extends string,
    ColumnType extends SQLBuiltinTypes,
    Options extends keyof SQLColumnOptions<ColumnType> = never,
  >(
    column: CheckDuplicateKey<Column, Schema>,
    type: ColumnType,
    options?: RequiredSubset<SQLColumnOptions<ColumnType>, Options>,
  ): ColumnSchemaBuilder<
    AddColumnToSchema<Schema, Column, ColumnType, Options>
  > {
    // Add the property
    Object.defineProperty(this._columns, column as string, {
      value: SQLColumn<ColumnType, Options>(type, options),
    })

    // Cast this as the correct modified return type
    return this as unknown as ColumnSchemaBuilder<
      AddColumnToSchema<Schema, Column, ColumnType, Options>
    >
  }
}

/**
 * Implementation of the {@link TableSchemaBuilder} that manipulates unknown objects
 */
class SQLTableSchemaBuilder<Schema extends SQLTableSchema>
  implements TableSchemaBuilder<Schema>
{
  private _key?: unknown
  private _columns: unknown

  constructor(columns: Schema["columns"], key?: unknown) {
    this._columns = columns
    this._key = key
  }

  get table(): Schema {
    const schema: unknown = {}

    if (this._key !== undefined) {
      Object.defineProperty(schema, "primaryKey", {
        enumerable: true,
        writable: false,
        value: this._key,
      })
    }

    Object.defineProperty(schema, "columns", {
      enumerable: true,
      writable: false,
      value: this._columns,
    })

    return schema as Schema
  }

  addColumn<
    Column extends string,
    ColumnType extends SQLBuiltinTypes,
    Options extends keyof SQLColumnOptions<ColumnType> = never,
  >(
    column: CheckDuplicateKey<Column, Schema["columns"]>,
    type: ColumnType,
    options?: RequiredSubset<SQLColumnOptions<ColumnType>, Options>,
  ): TableSchemaBuilder<
    AddColumnToTableSchema<Schema, Column, ColumnType, Options>
  > {
    // Add the property
    Object.defineProperty(this._columns, column as string, {
      value: SQLColumn<ColumnType, Options>(type, options),
    })

    // Cast this as the correct modified return type
    return this as unknown as TableSchemaBuilder<
      AddColumnToTableSchema<Schema, Column, ColumnType, Options>
    >
  }

  withKey<Column extends StringKeys<Schema["columns"]>[]>(
    ...columns: Column
  ): AddKeyToTable<Schema, Column> {
    // Add the key based on the number of columns passed through
    this._key = { column: columns }

    // Cast to correct type
    return this.table as unknown as AddKeyToTable<Schema, Column>
  }
}
