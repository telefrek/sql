import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  AbstractDatabaseEngine,
  createEngine,
  type GetQueryParameters,
  type GetReturnType,
  type SubmittableQuery,
} from "@telefrek/sql/engines/common.js"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"

export class MySQLQuery {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }
}

export function createMySQL<Database extends SQLDatabaseSchema>(
  database: Database
): AbstractDatabaseEngine<Database, MySQLQuery> {
  return createEngine(database, {
    checkQuery,
    createQuery,
    executeQuery,
  })
}

function checkQuery<T extends SubmittableQuery>(query: T): MySQLQuery {
  return query as unknown as MySQLQuery
}

function createQuery<T extends SQLQuery>(
  name: string,
  _query: T,
  _queryString?: string
): MySQLQuery {
  return new MySQLQuery(name)
}

function executeQuery<Query extends SubmittableQuery>(
  _query: MySQLQuery,
  _parameters: GetQueryParameters<Query>
): Promise<GetReturnType<Query>> {
  return Promise.reject(new Error("not implemented"))
}
