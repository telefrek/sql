import type { SQLDatabaseSchema } from "../../schema/database.js"
import { createContext, type QueryContext } from "../context.js"
import { type ParserOptions } from "../parser/options.js"
import { createFromQueryBuilder, type FromQueryBuilder } from "./from.js"
import {
  createInsertIntoQueryBuilder,
  type InsertIntoBuilder,
} from "./insert.js"

/**
 * A builder that guides users through the types of queries we support.
 */
export interface QueryBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
> {
  /** Creates a {@link FromQueryBuilder} to start a select query */
  select: FromQueryBuilder<Context, Options>

  /** Creates a {@link InsertIntoBuilder} to start an insert into query */
  insert: InsertIntoBuilder<Context, Options>
}

/**
 * Utility function to create a default {@link QueryBuilder}
 *
 * @param database The database to create the query against
 * @returns A {@link QueryBuilder} for the database with an empty {@link QueryContext}
 */
export function createQueryBuilder<
  Database extends SQLDatabaseSchema,
  Options extends ParserOptions
>(
  database: Database,
  options: Options
): QueryBuilder<QueryContext<Database>, Options> {
  return new DefaultQueryBuilder(createContext(database).context, options)
}

/**
 * Utility function to create a {@link QueryBuilder} using an existing contexxt
 *
 * @param context The current {@link QueryContext}
 * @returns A {@link QueryBuilder} that has access to the given context
 */
export function createSubQueryBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
>(context: Context, options: Options): QueryBuilder<Context, Options> {
  return new DefaultQueryBuilder(context, options)
}

/**
 * Default implementation of our query builder
 */
class DefaultQueryBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
> implements QueryBuilder<Context, Options>
{
  private _context: Context
  private _options: Options

  constructor(context: Context, options: Options) {
    this._context = context
    this._options = options
  }

  get select(): FromQueryBuilder<Context, Options> {
    return createFromQueryBuilder(this._context, this._options)
  }

  get insert(): InsertIntoBuilder<Context, Options> {
    return createInsertIntoQueryBuilder(this._context, this._options)
  }
}
