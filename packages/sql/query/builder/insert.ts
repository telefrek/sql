import type { AtLeastOne } from "@telefrek/type-utils/common"
import type { StringKeys } from "@telefrek/type-utils/object"
import type { ColumnReference } from "../../ast/columns.js"
import type { InsertClause } from "../../ast/queries.js"
import type { TableReference } from "../../ast/tables.js"
import type { ValueTypes } from "../../ast/values.js"
import type {
  ColumnTypeDefinition,
  GetValueType,
  SQLColumnSchema,
} from "../../schema/columns.js"
import type { AllowAliasing } from "../common.js"
import type {
  GetContextTables,
  GetContextTableSchema,
  QueryContext,
} from "../context.js"
import type { ParserOptions } from "../parser/options.js"
import type { ParseTableReference } from "../parser/table.js"
import { parseValue, type ExtractTSValueTypes } from "../parser/values.js"
import { buildColumnReference, type VerifyColumnReferences } from "./columns.js"
import { createReturningBuilder, type ReturningBuilder } from "./returning.js"
import { buildTableReference } from "./table.js"

/**
 * The builder for an insert clause
 */
export interface InsertIntoBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
> {
  /**
   * Specify which table to perform the insert on
   *
   * @param table The table to INSERT INTO
   */
  into<Table extends AllowAliasing<GetContextTables<Context>>>(
    table: Table
  ): ColumnValueBuilder<
    GetContextTableSchema<Context, Table>,
    ParseTableReference<Table, Options>
  >
}

/**
 * The builder for column values
 */
export interface ColumnValueBuilder<
  Schema extends SQLColumnSchema,
  Table extends TableReference,
  Columns extends ColumnReference[] = ColumnReference[]
> {
  // TODO: Validate the columns include all required plus any optional
  /**
   * Specify the columns to use for the insert
   *
   * @param columns The columns to choose
   */
  columns<Column extends AllowAliasing<StringKeys<Schema>>[]>(
    ...columns: AtLeastOne<Column>
  ): Omit<
    ColumnValueBuilder<Schema, Table, VerifyColumnReferences<Column>>,
    "columns"
  >

  /**
   * Choose what values to insert into the columns
   *
   * @param values The values used for the insert
   */
  values<Values extends CheckValueTypes<Schema, Columns>>(
    ...values: ExtractTSValueTypes<Values>
  ): ReturningBuilder<Schema, InsertClause<Table, Columns, Values>>
}

/**
 * Type to verify the values being inserted into column references
 */
type CheckValueTypes<
  Schema extends SQLColumnSchema,
  Columns
> = Columns extends [infer Column extends ColumnReference, ...infer Rest]
  ? Column extends ColumnReference<infer Reference, infer _>
    ? Reference["column"] extends StringKeys<Schema>
      ? Schema[Reference["column"]] extends infer C extends ColumnTypeDefinition
        ? Rest extends never[]
          ? [GetValueType<C>]
          : CheckValueTypes<Schema, Rest> extends infer V extends ValueTypes[]
          ? [GetValueType<C>, ...V]
          : CheckValueTypes<Schema, Rest>
        : never
      : never
    : never
  : never

/**
 * Create a new builder
 *
 * @param context The current context
 * @param options The current parser options
 *
 * @returns A new {@link InsertIntoBuilder}
 */
export function createInsertIntoQueryBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
>(context: Context, options: Options): InsertIntoBuilder<Context, Options> {
  return new DefaultInsertIntoBuilder(context, options)
}

/**
 * Default {@link InsertIntoBuilder} implementation
 */
class DefaultInsertIntoBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
> implements InsertIntoBuilder<Context, Options>
{
  private _context: Context
  private _options: Options
  constructor(context: Context, options: Options) {
    this._context = context
    this._options = options
  }

  into<Table extends AllowAliasing<GetContextTables<Context>>>(
    table: Table
  ): ColumnValueBuilder<
    GetContextTableSchema<Context, Table>,
    ParseTableReference<Table, Options>
  > {
    return new DefaultColumnValueBuilder(
      buildTableReference(table, this._options),
      []
    )
  }
}

/**
 * The default {@link ColumnValueBuilder} implementation
 */
class DefaultColumnValueBuilder<
  Schema extends SQLColumnSchema,
  Table extends TableReference,
  Columns extends ColumnReference[] = ColumnReference[]
> implements ColumnValueBuilder<Schema, Table, Columns>
{
  private _table: Table
  private _columns: Columns

  constructor(table: Table, columns: Columns) {
    this._table = table
    this._columns = columns
  }

  columns<Column extends AllowAliasing<StringKeys<Schema>>[]>(
    ...columns: AtLeastOne<Column>
  ): Omit<
    ColumnValueBuilder<Schema, Table, VerifyColumnReferences<Column>>,
    "columns"
  > {
    const verified = columns.map((c) =>
      buildColumnReference(c)
    ) as unknown as VerifyColumnReferences<Column>

    return new DefaultColumnValueBuilder(this._table, verified)
  }

  values<Values extends CheckValueTypes<Schema, Columns>>(
    ...values: ExtractTSValueTypes<Values>
  ): ReturningBuilder<Schema, InsertClause<Table, Columns, Values>> {
    return createReturningBuilder({
      type: "InsertClause",
      table: this._table,
      columns: this._columns,
      values: (values as unknown[]).map((v) => parseValue(String(v))) as Values,
    })
  }
}
