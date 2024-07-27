import { DatabaseEngine, createEngine } from "@telefrek/sql/engines/common.js"
import {
  QUERY_PROVIDER_SYMBOL,
  type BoundQuery,
  type SubmittableQuery,
} from "@telefrek/sql/engines/submittable.js"
import { parseQuery, type GetReturnType } from "@telefrek/sql/engines/utils.js"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"
import { parseDateToSafeBigInt, parseSafeBigInt } from "@telefrek/sql/types.js"
import pg from "pg"
import { DRIVER_ID } from "./index.js"

import { PostgresQueryVisitor } from "./visitor.js"

let PG_CLIENT: pg.Client | undefined

pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (v) =>
  v ? parseDateToSafeBigInt(v) : v
)

pg.types.setTypeParser(pg.types.builtins.INT8, (v) =>
  v ? parseSafeBigInt(v) : v
)

pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => +v)

/**
 * Initialize the engine with the provided client
 *
 * @param client The {@link pg.Client} to use
 */
export function initializePostgres(client: pg.Client): void {
  PG_CLIENT = client
}

/**
 * Create a {@link DatabaseEngine} bound to the {@link SQLDatabaseSchema}
 *
 * @param database The database to create the engine for
 * @returns A new {@link DatabaseEngine} for Postgres
 */
export function createPostgresEngine<Database extends SQLDatabaseSchema>(
  database: Database
): DatabaseEngine<Database> {
  if (PG_CLIENT === undefined) {
    throw new Error("Need to initialize pg")
  }

  return createEngine(database, {
    createQuery(name, query, _originalQuery) {
      return parseQuery(name, query, DRIVER_ID, new PostgresQueryVisitor())
    },
    executeQuery,
  })
}

/**
 * Utility method for issuing Postgres queries
 *
 * @param query The query to execute
 * @returns The results of executing the query
 */
async function executeQuery<Query extends SubmittableQuery | BoundQuery>(
  query: Query
): Promise<GetReturnType<Query>> {
  if (
    QUERY_PROVIDER_SYMBOL in query &&
    query[QUERY_PROVIDER_SYMBOL] === DRIVER_ID
  ) {
    const result = await PG_CLIENT!.query(query.queryString)
    if (result.rows.length > 0) {
      return result.rows as unknown as GetReturnType<Query>
    }

    return result.rowCount as unknown as GetReturnType<Query>
  }

  throw new Error("Unexpected query type for engine")
}
