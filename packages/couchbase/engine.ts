import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  AbstractDatabaseEngine,
  createEngine,
  type GetQueryParameters,
  type GetReturnType,
  type SubmittableQuery,
} from "@telefrek/sql/engines/common.js"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"

export class CouchbaseQuery {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }
}

export function createCouchbaseEngine<Database extends SQLDatabaseSchema>(
  database: Database
): AbstractDatabaseEngine<Database, CouchbaseQuery> {
  return createEngine(database, {
    checkQuery,
    createQuery,
    executeQuery,
  })
}

function checkQuery<T extends SubmittableQuery>(query: T): CouchbaseQuery {
  return query as unknown as CouchbaseQuery
}

function createQuery<T extends SQLQuery>(
  name: string,
  _query: T,
  _queryString?: string
): CouchbaseQuery {
  return new CouchbaseQuery(name)
}

function executeQuery<Query extends SubmittableQuery>(
  _query: CouchbaseQuery,
  _parameters: GetQueryParameters<Query>
): Promise<GetReturnType<Query>> {
  return Promise.reject(new Error("not implemented"))
}
