import {
  type ColumnTypeDefinition,
  type CompositePrimaryKey,
  type PrimaryKey,
  type SQLColumnOptions,
  type SQLColumnSchema,
  type SQLDatabaseSchema,
  type SQLDatabaseTables,
  type SQLTableKey,
  type SQLTableSchema,
} from "./schema.js"
import type { AtLeastOne, Flatten } from "./type-utils/common.js"
import {
  type CheckDuplicateKey,
  type RequiredLiteralKeys,
  type RequiredSubset,
  type StringKeys,
} from "./type-utils/object.js"
import type { SQLBuiltinTypes } from "./types.js"

/**
 * An object that provides a SQLDatabaseSchema
 */
export interface SchemaProvider<Schema extends SQLDatabaseSchema> {
  readonly schema: Schema
}

/**
 * An object that provides a SQLTableSchema
 */
export interface TableSchemaBuilder<
  Schema extends SQLTableSchema = SQLTableSchema
> {
  readonly schema: Schema
}

/**
 * Creates a database schema builder
 *
 * @returns A new schema builder
 */
export function createSchemaBuilder(): SQLSchemaBuilder<EmptySchema> {
  return new SQLSchemaBuilder({ tables: {}, relations: [] })
}

/**
 * Create a builder for manipulating the {@link SQLColumnSchema}
 *
 * @param columns The current columns
 * @returns A new {@link ColumnSchemaBuilder} for modifying the schema
 *
 * @template Columns The current SQLColumnSchema
 */
export function columnSchemaBuilder<
  Columns extends SQLColumnSchema = NoColumns
>(columns: Columns): ColumnSchemaBuilder<Columns> {
  return new ColumnSchemaBuilder(columns)
}

/**
 * Type to collapse the column definition based on the optional keys
 *
 * @template T The type of the column
 * @template K The keys from the options
 */
type FinalColumnDefinition<
  T extends SQLBuiltinTypes,
  K extends keyof SQLColumnOptions<T>
> = Flatten<
  RequiredLiteralKeys<ColumnTypeDefinition<T>> &
    RequiredSubset<SQLColumnOptions<T>, K>
>

/**
 * Define a SQLColumn definition
 *
 * @param type The column type
 * @param options The SQLColumnOptions
 * @returns A ColumnType definition with limited schema information
 *
 * @template T The type of the column
 * @template K The keys from the options used
 */
export function SQLColumn<
  T extends SQLBuiltinTypes,
  K extends keyof SQLColumnOptions<T> = never
>(
  type: T,
  options?: RequiredSubset<SQLColumnOptions<T>, K>
): FinalColumnDefinition<T, K> {
  return {
    ...options,
    type,
  } as unknown as FinalColumnDefinition<T, K>
}

/**
 * Verify the type is a SQLColumnSchema
 *
 * @template T The type to verify
 */
type CheckColumnSchema<T> = T extends SQLColumnSchema ? T : never

/**
 * Verify the type is a SQLDatabaseTables
 *
 * @template T The type to verify
 */
type CheckSQLTables<T> = T extends SQLDatabaseTables ? T : never

/**
 * A SQLColumnSchema with no columns
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type NoColumns = CheckColumnSchema<{}>

/**
 * A SQLDatabaseTables with no tables
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type NoTables = CheckSQLTables<{}>

/**
 * An empty SQLTableSchema
 */
type EmptyTableSchema = SQLTableSchema<NoColumns>

/**
 * An empty SQLDatabaseSchema
 */
type EmptySchema = SQLDatabaseSchema<NoTables, []>

/**
 * Handles building a column schema
 */
class ColumnSchemaBuilder<T extends SQLColumnSchema = NoColumns> {
  private _schema: T
  constructor(schema: T) {
    this._schema = schema
  }

  /**
   * Get the current schema
   */
  get schema(): T {
    return this._schema
  }

  /**
   * Add the column to the current schema
   *
   * @param column The column to add
   * @param type The type of column
   * @param options The options for the column
   * @returns An updated ColumnSchemaBuilder
   */
  addColumn<
    Column extends string,
    CType extends SQLBuiltinTypes,
    K extends keyof SQLColumnOptions<CType> = never
  >(
    column: Column,
    type: CType,
    options?: RequiredSubset<SQLColumnOptions<CType>, K>
  ): ColumnSchemaBuilder<AddColumnToSchema<T, Column, CType, K>> {
    // Add the property
    Object.defineProperty(this._schema, column, {
      value: SQLColumn<CType, K>(type, options),
    })

    return this as unknown as ColumnSchemaBuilder<
      AddColumnToSchema<T, Column, CType, K>
    >
  }
}

/**
 * A builder class for manipulating schemas
 */
class SQLSchemaBuilder<T extends SQLDatabaseSchema = EmptySchema>
  implements SchemaProvider<T>
{
  private _schema: T
  constructor(schema: T) {
    this._schema = schema
  }

  get schema(): T {
    return this._schema
  }

  /**
   * Adds a table to the schema
   *
   * @param table The table to add
   * @param builder A builder function for the table schema
   * @returns A modified builder with the updated schema
   */
  addTable<Table extends string, Builder extends TableSchemaBuilder>(
    table: CheckDuplicateKey<Table, T["tables"]>,
    builder: (b: SQLTableSchemaBuilder) => Builder
  ): AddTableToBuilder<Builder, Table, T> {
    const ts: EmptyTableSchema = { columns: {} }
    const schema = builder(new SQLTableSchemaBuilder(ts)).schema
    Object.defineProperty(this._schema.tables, table as string, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: schema,
    })

    return this as unknown as AddTableToBuilder<Builder, Table, T>
  }
}

/**
 * Utility type to add the table definition to a schema to prevent return type re-calculation
 *
 * @template TableBuilder The current schema builder
 * @template Table The table to add
 * @template Database The current database schema
 */
type AddTableToBuilder<
  TableBuilder,
  Table extends string,
  Database extends SQLDatabaseSchema
> = TableBuilder extends TableSchemaBuilder<infer Schema>
  ? SQLSchemaBuilder<AddTableToSchema<Database, Table, Schema>>
  : never

/**
 * Utility type to add a table to an existing schema
 *
 * @template Database The database to modify
 * @template Table The table name
 * @template TableSchema The schema for the table
 */
type AddTableToSchema<
  Database extends SQLDatabaseSchema,
  Table extends string,
  TableSchema extends SQLTableSchema
> = Database extends SQLDatabaseSchema<infer Tables, infer Relations>
  ? SQLDatabaseSchema<
      Flatten<Tables & { [key in Table]: TableSchema }>,
      Relations
    >
  : never

/**
 * Utility type to add a column to a schema
 *
 * @template Columns the current schema
 * @template Column The name of the column
 * @template CType The columnType
 * @template K The required keys for the column options
 */
type AddColumnToSchema<
  Columns extends SQLColumnSchema,
  Column extends string,
  CType extends SQLBuiltinTypes,
  K extends keyof SQLColumnOptions<CType>
> = CheckColumnSchema<
  Flatten<
    Columns & {
      [key in Column]: FinalColumnDefinition<CType, K>
    }
  >
>

/**
 * Utility type to add the key to the table schema
 *
 * @template The column schema
 * @template T The array of columns or single column for the key
 */
type AddKeyToTable<
  Columns extends SQLColumnSchema,
  Column
> = TableSchemaBuilder<
  SQLTableKey<
    Columns,
    Column extends (infer T)[]
      ? Column["length"] extends 1
        ? PrimaryKey<T>
        : CompositePrimaryKey<Column>
      : never
  >
>

class SQLTableSchemaBuilder<
  Columns extends SQLColumnSchema = NoColumns,
  Schema extends SQLTableSchema<Columns> = SQLTableSchema<Columns>
> implements TableSchemaBuilder<Schema>
{
  private _schema: Schema

  constructor(schema: Schema) {
    this._schema = schema
  }

  get schema(): Schema {
    return this._schema
  }

  addColumn<
    Column extends string,
    CType extends SQLBuiltinTypes,
    K extends keyof SQLColumnOptions<CType> = never
  >(
    column: CheckDuplicateKey<Column, Schema>,
    type: CType,
    options?: RequiredSubset<SQLColumnOptions<CType>, K>
  ): SQLTableSchemaBuilder<AddColumnToSchema<Columns, Column, CType, K>> {
    Object.defineProperty(this._schema["columns"], column as string, {
      enumerable: true,
      configurable: false,
      writable: false,
      value: SQLColumn(type, options),
    })

    return this as unknown as SQLTableSchemaBuilder<
      AddColumnToSchema<Columns, Column, CType, K>
    >
  }

  withKey<Column extends AtLeastOne<StringKeys<Columns>>>(
    ...secondary: Column
  ): AddKeyToTable<Columns, Column> {
    // Add the primary key as a composite
    if (secondary.length > 1) {
      Object.defineProperty(this._schema, "primaryKey", {
        value: { columns: [...secondary] },
      })
    } else {
      Object.defineProperty(this._schema, "primaryKey", {
        value: { column: secondary[0] },
      })
    }

    return this as unknown as AddKeyToTable<Columns, Column>
  }
}
