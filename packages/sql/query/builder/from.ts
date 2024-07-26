import type { IgnoreAny } from "@telefrek/type-utils/common.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import { type AllowAliasing } from "../common.js"
import {
  modifyContext,
  type ActivateTableContext,
  type GetContextTableSchema,
  type GetContextTables,
  type QueryContext,
} from "../context.js"
import type { ParserOptions } from "../parser/options.js"
import type { ParseTableReference } from "../parser/table.js"
import {
  createSelectedColumnsBuilder,
  type SelectedColumnsBuilder,
} from "./columns.js"
import { buildTableReference } from "./table.js"

/**
 * Start selection from a table in the context
 */
export interface FromQueryBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
> {
  /**
   * Choose a table to select data from and optionally alias it
   *
   * @param table The table or table alias to select from
   */
  from<Table extends AllowAliasing<GetContextTables<Context>>>(
    table: Table
  ): SelectedColumnsBuilder<
    ActivateTableContext<Context, ParseTableReference<Table, Options>>,
    ParseTableReference<Table, Options>
  >
}

/**
 * Create a {@link FromQueryBuilder} with the given context
 *
 * @param context The {@link QueryContext} to use for the builder
 * @returns A {@link FromQureyBuilder} for the given context
 */
export function createFromQueryBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
>(context: Context, options: Options): FromQueryBuilder<Context, Options> {
  return new DefaultFromQueryBuilder(context, options)
}

class DefaultFromQueryBuilder<
  Database extends SQLDatabaseSchema,
  Context extends QueryContext<Database>,
  Options extends ParserOptions
> implements FromQueryBuilder<Context, Options>
{
  private _context: Context
  private _options: Options

  constructor(context: Context, options: Options) {
    this._context = context
    this._options = options
  }

  from<Table extends AllowAliasing<GetContextTables<Context>>>(
    table: Table
  ): SelectedColumnsBuilder<
    ActivateTableContext<
      Context,
      ParseTableReference<Table, Options>,
      GetContextTableSchema<Context, Table>
    >,
    ParseTableReference<Table, Options>
  > {
    let context = this._context as unknown as ActivateTableContext<
      Context,
      ParseTableReference<Table, Options>,
      GetContextTableSchema<Context, Table>
    >

    const reference = buildTableReference(table, this._options)

    if (
      context.active &&
      typeof context.active === "object" &&
      !(reference.alias in context.active)
    ) {
      context = modifyContext(context).copy(reference as IgnoreAny)
        .context as unknown as ActivateTableContext<
        Context,
        ParseTableReference<Table, Options>,
        GetContextTableSchema<Context, Table>
      >
    }

    return createSelectedColumnsBuilder(context, reference)
  }
}
