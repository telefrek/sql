import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  AbstractDatabaseEngine,
  createEngine,
  type DatabaseEngineExecuteParameters,
  type GetReturnType,
  type SubmittableQuery,
} from "@telefrek/sql/engines/common.js"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"
import { parseDateToSafeBigInt, parseSafeBigInt } from "@telefrek/sql/types"
import pg from "pg"

let PG_CLIENT: pg.Client | undefined

pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (v) =>
  v ? parseDateToSafeBigInt(v) : v
)

pg.types.setTypeParser(pg.types.builtins.INT8, (v) =>
  v ? parseSafeBigInt(v) : v
)

pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => +v)

export function initializePostgres(client: pg.Client): void {
  PG_CLIENT = client
}

export class PostgresQuery {
  readonly name: string
  readonly query: string

  constructor(name: string, query: string) {
    this.name = name
    this.query = query
  }
}

export function createPostgresEngine<Database extends SQLDatabaseSchema>(
  database: Database
): AbstractDatabaseEngine<Database, PostgresQuery> {
  if (PG_CLIENT === undefined) {
    throw new Error("Need to initialize pg")
  }

  return createEngine(database, {
    checkQuery,
    createQuery,
    executeQuery,
  }) as AbstractDatabaseEngine<Database, PostgresQuery>
}

function checkQuery<T extends SubmittableQuery>(query: T): PostgresQuery {
  return query as unknown as PostgresQuery
}

function createQuery<T extends SQLQuery>(
  name: string,
  _query: T,
  _queryString?: string
): PostgresQuery {
  return new PostgresQuery(name, _queryString ?? "")
}

async function executeQuery<Query extends SubmittableQuery>(
  ...args: DatabaseEngineExecuteParameters<Query>
): Promise<GetReturnType<Query>> {
  const result = await PG_CLIENT!.query(checkQuery(args[0]).query)
  if (result.rows.length > 0) {
    return result.rows as unknown as GetReturnType<Query>
  }

  return result.rowCount as unknown as GetReturnType<Query>
}
