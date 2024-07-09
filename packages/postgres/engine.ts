import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  AbstractDatabaseEngine,
  createEngine,
  type GetQueryParameters,
  type GetReturnType,
  type SubmittableQuery,
} from "@telefrek/sql/engines/common.js"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"

export class PostgresQuery {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }
}

export function createPostgresEngine<Database extends SQLDatabaseSchema>(
  database: Database
): AbstractDatabaseEngine<Database, PostgresQuery> {
  return createEngine(database, {
    checkQuery,
    createQuery,
    executeQuery,
  })
}

function checkQuery<T extends SubmittableQuery>(query: T): PostgresQuery {
  return query as unknown as PostgresQuery
}

function createQuery<T extends SQLQuery>(
  name: string,
  _query: T,
  _queryString?: string
): PostgresQuery {
  return new PostgresQuery(name)
}

function executeQuery<Query extends SubmittableQuery>(
  _query: PostgresQuery,
  _parameters: GetQueryParameters<Query>
): Promise<GetReturnType<Query>> {
  return Promise.reject(new Error("not implemented"))
}
