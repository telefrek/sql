import type { SQLDatabaseSchema } from "../../schema/database.js"
import { createContext, type QueryContext } from "../context.js"
import { createFromQueryBuilder, type FromQueryBuilder } from "./from.js"

/**
 * A builder that guides users through the types of queries we support.
 */
export interface QueryBuilder<Context extends QueryContext> {
  /** Creates a {@link FromQueryBuilder} to start a select query */
  select: FromQueryBuilder<Context>
}

/**
 * Utility function to create a default {@link QueryBuilder}
 *
 * @param database The database to create the query against
 * @returns A {@link QueryBuilder} for the database with an empty {@link QueryContext}
 */
export function createQueryBuilder<Database extends SQLDatabaseSchema>(
  database: Database,
): QueryBuilder<QueryContext<Database>> {
  return new DefaultQueryBuilder(createContext(database).context)
}

/**
 * Default implementation of our query builder
 */
class DefaultQueryBuilder<Context extends QueryContext>
  implements QueryBuilder<Context>
{
  private _context: Context

  constructor(context: Context) {
    this._context = context
  }

  get select(): FromQueryBuilder<Context> {
    return createFromQueryBuilder(this._context)
  }
}
