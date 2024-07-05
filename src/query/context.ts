import type { TableReference } from "../ast/tables.js"
import {
  createColumnSchemaBuilder,
  type ColumnSchemaBuilderFn,
} from "../schema/builder/table.js"
import type { SQLColumnSchema } from "../schema/columns.js"
import type {
  SQLDatabaseSchema,
  SQLDatabaseTables,
  SQLTableSchema,
} from "../schema/database.js"
import type { Flatten, IgnoreEmpty, Invalid } from "../type-utils/common.js"
import {
  clone,
  type CheckDuplicateKey,
  type StringKeys,
} from "../type-utils/object.js"
import type { ParseTableReference } from "./parser/table.js"

/**
 * Create a new builder for the given database
 *
 * @param database The database to use
 * @returns A new {@link QueryContextBuilder}
 */
export function createContext<Database extends SQLDatabaseSchema>(
  database: Database,
): QueryContextBuilder<Database> {
  return new QueryContextBuilder<Database>({
    database: clone(database),
    active: {},
    returning: 0,
  })
}

/**
 * Create a builder using the existing context
 *
 * @param context The {@link QueryContext} to use
 * @returns A new {@link QueryContextBuilder}
 */
export function modifyContext<Context extends QueryContext>(
  context: Context,
): QueryContextBuilder<Context["database"], Context> {
  return new QueryContextBuilder<Context["database"], Context>(context)
}

/**
 * The current context for a given query
 */
export type QueryContext<
  Database extends SQLDatabaseSchema = SQLDatabaseSchema,
  Active extends SQLDatabaseTables = IgnoreEmpty,
  Returning extends SQLColumnSchema | number = SQLColumnSchema | number,
> = {
  database: Database
  active: Active
  returning: Returning
}

/**
 * Retrieve the full set of tables that are available (base as well as active)
 */
export type GetContextTables<Context extends QueryContext> =
  Context extends QueryContext<infer Database, infer Active, infer _>
    ? StringKeys<Database["tables"]> | StringKeys<Active>
    : never

export type GetSelectableColumns<Context extends QueryContext> =
  Context extends QueryContext<infer _DB, infer Active, infer _Ret>
    ? GetColumnNames<Active>
    : never

type GetColumnNames<Schema extends SQLDatabaseTables> = {
  [Table in StringKeys<Schema>]: {
    [Column in StringKeys<Schema[Table]["columns"]>]: [Column] extends [
      GetUniqueColumns<Schema>,
    ]
      ? Column
      : `${Table}.${Column}`
  }[StringKeys<Schema[Table]["columns"]>]
}[StringKeys<Schema>]

type GetOtherColumns<
  Schema extends SQLDatabaseTables,
  Table extends keyof Schema,
> = {
  [Key in keyof Schema]: Key extends Table
    ? never
    : StringKeys<Schema[Table]["columns"]>
}[keyof Schema]

type GetUniqueColumns<Schema extends SQLDatabaseTables> = {
  [Key in keyof Schema]: UniqueKeys<
    StringKeys<Schema[Key]["columns"]>,
    GetOtherColumns<Schema, Key>
  >
}[keyof Schema]

type UniqueKeys<Left extends string, Right extends string> = {
  [V in Left]: [V] extends [Right] ? never : V
}[Left]

/**
 * Class used for manipulating {@link QueryContext} objects
 */
class QueryContextBuilder<
  Database extends SQLDatabaseSchema,
  Context extends QueryContext<Database> = QueryContext<Database>,
> {
  private _context: Context
  constructor(context: Context) {
    this._context = context
  }

  /**
   * Retrieve the current Context
   */
  get context(): Context {
    return this._context
  }

  /**
   * Add a table with the given definition to the context
   *
   * @param table The table to add
   * @param builder The function to use for building the table or schema
   * @returns An updated context builder
   */
  add<Table extends string, Updated extends SQLColumnSchema>(
    table: CheckDuplicateKey<Table, Context["active"]>,
    builder: ColumnSchemaBuilderFn<IgnoreEmpty, Updated> | Updated,
  ): QueryContextBuilder<
    Database,
    ActivateTableContext<Context, ParseTableReference<Table>, Updated>
  > {
    // Modify the schema
    const schema =
      typeof builder === "function"
        ? builder(createColumnSchemaBuilder()).columns
        : builder

    // Add the table
    Object.defineProperty(this._context["active"], table as string, {
      enumerable: true,
      writable: false,
      value: { columns: schema },
    })

    // Ignore the typing we know it is correct here
    return this as unknown as QueryContextBuilder<
      Database,
      ActivateTableContext<Context, ParseTableReference<Table>, Updated>
    >
  }

  /**
   * Copy the schema from the database into the active set
   *
   * @param table The table to copy the definition from
   * @returns An updated context builder
   *
   * @template Table The table from the database to copy
   */
  copy<Table extends TableReference>(
    table: CheckDuplicateTableReference<Table, Context["active"]>,
  ): QueryContextBuilder<
    Database,
    ActivateTableContext<
      Context,
      Table,
      Database["tables"][Table["table"]]["columns"]
    >
  > {
    const t = table as unknown as Table
    return this.add(
      t.alias as CheckDuplicateKey<string, Context["active"]>,
      this._context["database"]["tables"][t.table]["columns"],
    )
  }

  /**
   * Update the return type of the context
   *
   * @param schema The schema for the return type
   * @returns An updated context
   *
   * @template Schema The new return schema
   */
  returning<Schema extends SQLColumnSchema>(
    schema: Schema,
  ): QueryContextBuilder<
    Database,
    ChangeContextReturn<Database, Context, Schema>
  > {
    Object.defineProperty(this._context, "returning", {
      enumerable: true,
      writable: false,
      value: schema,
    })

    return this as unknown as QueryContextBuilder<
      Database,
      ChangeContextReturn<Database, Context, Schema>
    >
  }
}

/**
 * Utility type to check for table reference conflict with an existing table
 */
type CheckDuplicateTableReference<
  Table extends TableReference,
  Tables extends SQLDatabaseTables,
> =
  CheckDuplicateKey<Table["alias"], Tables> extends Table["alias"]
    ? Table
    : Invalid<"Table reference alias conflicts with existing table name">

/**
 * Utility type for retrieving the table schema from the context
 */
export type GetContextTableSchema<
  Context extends QueryContext,
  Table extends string,
> =
  Context extends QueryContext<infer Database, infer Active, infer _>
    ? Table extends StringKeys<Active>
      ? Active[Table]["columns"]
      : Table extends StringKeys<Database["tables"]>
        ? Database["tables"][Table]["columns"]
        : never
    : never

/**
 * Utility type that adds the given table and schema to the active context
 */
export type ActivateTableContext<
  Context extends QueryContext,
  Table extends TableReference,
  Schema extends SQLColumnSchema = GetContextTableSchema<
    Context,
    Table["table"]
  >,
> =
  Context extends QueryContext<
    Context["database"],
    infer Active,
    infer Returning
  >
    ? QueryContext<
        Context["database"],
        CheckSQLTables<
          Flatten<Active & { [key in Table["alias"]]: SQLTableSchema<Schema> }>
        >,
        Returning
      >
    : never

type CheckSQLTables<T> = T extends SQLDatabaseTables ? T : never

/**
 * Change the context return type
 */
type ChangeContextReturn<
  Database extends SQLDatabaseSchema,
  Context extends QueryContext<Database>,
  Returning extends SQLColumnSchema,
> =
  Context extends QueryContext<Database, infer Active, infer _>
    ? QueryContext<Database, Active, Returning>
    : never
