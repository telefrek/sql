import type { IgnoreAny } from "@telefrek/type-utils/common.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import { ALIAS_REGEX, type AllowAliasing } from "../common.js"
import {
  modifyContext,
  type ActivateTableContext,
  type GetContextTableSchema,
  type GetContextTables,
  type QueryContext,
} from "../context.js"
import type { ParseTableReference } from "../parser/table.js"
import {
  createSelectedColumnsBuilder,
  type SelectedColumnsBuilder,
} from "./columns.js"

/**
 * Start selection from a table in the context
 */
export interface FromQueryBuilder<Context extends QueryContext> {
  /**
   * Choose a table to select data from and optionally alias it
   *
   * @param table The table or table alias to select from
   */
  from<Table extends AllowAliasing<GetContextTables<Context>>>(
    table: Table
  ): SelectedColumnsBuilder<
    ActivateTableContext<Context, ParseTableReference<Table>>,
    ParseTableReference<Table>
  >
}

/**
 * Create a {@link FromQueryBuilder} with the given context
 *
 * @param context The {@link QueryContext} to use for the builder
 * @returns A {@link FromQureyBuilder} for the given context
 */
export function createFromQueryBuilder<Context extends QueryContext>(
  context: Context
): FromQueryBuilder<Context> {
  return new DefaultFromQueryBuilder(context)
}

class DefaultFromQueryBuilder<
  Database extends SQLDatabaseSchema,
  Context extends QueryContext<Database>
> implements FromQueryBuilder<Context>
{
  private _context: Context

  constructor(context: Context) {
    this._context = context
  }

  from<Table extends AllowAliasing<GetContextTables<Context>>>(
    table: Table
  ): SelectedColumnsBuilder<
    ActivateTableContext<
      Context,
      ParseTableReference<Table>,
      GetContextTableSchema<Context, Table>
    >,
    ParseTableReference<Table>
  > {
    let context = this._context as unknown as ActivateTableContext<
      Context,
      ParseTableReference<Table>,
      GetContextTableSchema<Context, Table>
    >

    const reference = buildTableReference(table)

    if (
      context.active &&
      typeof context.active === "object" &&
      !(reference.alias in context.active)
    ) {
      context = modifyContext(context).copy(reference as IgnoreAny)
        .context as unknown as ActivateTableContext<
        Context,
        ParseTableReference<Table>,
        GetContextTableSchema<Context, Table>
      >
    }

    return createSelectedColumnsBuilder(context, reference)
  }
}

function buildTableReference<Table extends string>(
  table: Table
): ParseTableReference<Table> {
  const ref = {
    type: "TableReference",
    table,
    alias: table,
  } as unknown as ParseTableReference<Table>

  if (ALIAS_REGEX.test(table)) {
    const data = table.split(" AS ")
    ref.table = data[0]
    ref.alias = data[1]
  }

  return ref
}
