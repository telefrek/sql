import type { SQLDatabaseSchema } from "../../schema/database.js"
import { createContext, type QueryContext } from "../context.js"
import { createFromQueryBuilder, type FromQueryBuilder } from "./from.js"

export interface QueryBuilder<Context extends QueryContext> {
  select: FromQueryBuilder<Context>
}

export function createQueryBuilder<Database extends SQLDatabaseSchema>(
  database: Database,
): QueryBuilder<QueryContext<Database>> {
  return new DefaultQueryBuilder(createContext(database).context)
}

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
