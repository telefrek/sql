import type { Flatten } from "../../type-utils/common.js"
import type { CheckDuplicateKey, StringKeys } from "../../type-utils/object.js"
import type {
  ForeignKeys,
  SQLDatabaseSchema,
  SQLDatabaseTables,
  SQLTableSchema,
} from "../database.js"
import type {
  ForeignKey,
  ForeignKeyColumns,
  ForeignKeySourceTables,
} from "../keys.js"
import { createTableSchemaBuilder, type TableSchemaBuilder } from "./table.js"

/**
 * Utility type to define an empty table schema with no tables
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyTableSchema = {}

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyForeignKeys = {}

/**
 * Utility type for an empty schema
 */
type EmptyDatabaseSchema = SQLDatabaseSchema<EmptyTableSchema, EmptyForeignKeys>

/**
 * A function that provides a TableSchemaBuilder and returns the builder or schema
 */
type TableBuilderFn<Schema extends SQLTableSchema> = (
  builder: TableSchemaBuilder
) => TableSchemaBuilder<Schema> | Schema

/**
 * Utility type to add the table definition to a schema to prevent return type re-calculation
 */
type AddTableToBuilder<
  TableSchema extends SQLTableSchema,
  Table extends string,
  Database extends SQLDatabaseSchema
> = DatabaseSchemaBuilder<AddTableToSchema<Database, Table, TableSchema>>

/**
 * Utility type to add a table to an existing schema
 */
type AddTableToSchema<
  Database extends SQLDatabaseSchema,
  Table extends string,
  TableSchema extends SQLTableSchema
> = Database extends SQLDatabaseSchema<infer Tables, infer Relations>
  ? Relations extends ForeignKeys
    ? CheckSQLDatabaseSchema<
        Flatten<Tables & { [key in Table]: TableSchema }>,
        Relations
      >
    : never
  : never

type AddForeignKeyToSchema<
  Database extends SQLDatabaseSchema,
  Name extends string,
  FK
> = Database extends SQLDatabaseSchema<infer Tables, infer Keys>
  ? FK extends ForeignKey<
      Tables,
      infer Source,
      infer Destination,
      infer Columns
    >
    ? SQLDatabaseSchema<
        Tables,
        Flatten<
          Keys & {
            [key in Name]: ForeignKey<Tables, Source, Destination, Columns>
          }
        >
      >
    : never
  : never

type CheckSQLDatabaseSchema<Tables, Relations> =
  Tables extends SQLDatabaseTables
    ? Relations extends ForeignKeys
      ? SQLDatabaseSchema<Tables, Relations>
      : never
    : never

export function createDatabaseSchema<
  Schema extends SQLDatabaseSchema = EmptyDatabaseSchema
>(current?: Schema): DatabaseSchemaBuilder<Schema> {
  return new SQLDatabaseSchemaBuilder(current)
}

/**
 * An object that provides a SQLDatabaseSchema
 */
export interface DatabaseSchemaBuilder<Schema extends SQLDatabaseSchema> {
  readonly schema: Schema

  /**
   * Add a table to the database schema
   *
   * @param table The table to add
   * @param builder The Table builder function to use for the definition
   */
  addTable<Table extends string, TableSchema extends SQLTableSchema>(
    table: CheckDuplicateKey<Table, Schema["tables"]>,
    builder: TableBuilderFn<TableSchema>
  ): AddTableToBuilder<TableSchema, Table, Schema>

  addForeignKey<
    Name extends string,
    Source extends ForeignKeySourceTables<Schema["tables"]>,
    Destination extends StringKeys<Schema["tables"]>,
    Columns extends ForeignKeyColumns<Schema["tables"], Source, Destination>
  >(
    name: CheckDuplicateKey<Name, Schema["relations"]>,
    source: Source,
    destination: Destination,
    ...column: Columns
  ): DatabaseSchemaBuilder<
    AddForeignKeyToSchema<
      Schema,
      Name,
      ForeignKey<Schema["tables"], Source, Destination, Columns>
    >
  >
}

class SQLDatabaseSchemaBuilder<Schema extends SQLDatabaseSchema>
  implements DatabaseSchemaBuilder<Schema>
{
  private _schema: unknown

  constructor(schema?: Schema) {
    this._schema = schema ?? { tables: {}, relations: [] }
  }

  get schema(): Schema {
    return this._schema as Schema
  }

  addTable<Table extends string, TableSchema extends SQLTableSchema>(
    table: CheckDuplicateKey<Table, Schema["tables"]>,
    builder: TableBuilderFn<TableSchema>
  ): AddTableToBuilder<TableSchema, Table, Schema> {
    const result = builder(createTableSchemaBuilder())
    const schema = "schema" in result ? result["schema"] : result

    const current = this._schema as Schema
    Object.defineProperty(current.tables, table as string, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: schema,
    })

    return this as unknown as AddTableToBuilder<TableSchema, Table, Schema>
  }

  private _getTableKey(table: object): unknown {
    return "primaryKey" in table &&
      typeof table.primaryKey === "object" &&
      table.primaryKey !== null &&
      "column" in table.primaryKey
      ? Array.isArray(table.primaryKey.column)
        ? table.primaryKey.column
        : [table.primaryKey.column]
      : []
  }

  addForeignKey<
    Name extends string,
    Source extends ForeignKeySourceTables<Schema["tables"]>,
    Destination extends StringKeys<Schema["tables"]>,
    Columns extends ForeignKeyColumns<Schema["tables"], Source, Destination>
  >(
    name: CheckDuplicateKey<Name, Schema["relations"]>,
    source: Source,
    destination: Destination,
    ...column: Columns
  ): DatabaseSchemaBuilder<
    AddForeignKeyToSchema<
      Schema,
      Name,
      ForeignKey<Schema["tables"], Source, Destination, Columns>
    >
  > {
    const current = this._schema as Schema
    Object.defineProperty(current.relations, name as string, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: {
        source,
        sourceColumns: this._getTableKey(current.tables[source]),
        destination,
        destinationColumns: column,
      },
    })

    return this as unknown as DatabaseSchemaBuilder<
      AddForeignKeyToSchema<
        Schema,
        Name,
        ForeignKey<Schema["tables"], Source, Destination, Columns>
      >
    >
  }
}