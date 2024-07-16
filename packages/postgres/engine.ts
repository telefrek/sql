import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  DatabaseEngine,
  createEngine,
  type DatabaseEngineExecuteParameters,
  type GetReturnType,
  type ParameterizedQuery,
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

const POSTGRES_QUERY_TYPE: unique symbol = Symbol()

export class PostgresQuery<
  RowType extends object | number = object | number,
  Parameters extends object = never
> implements ParameterizedQuery<RowType, Parameters>
{
  readonly name: string
  readonly query: string
  readonly parameters?: Parameters;

  [POSTGRES_QUERY_TYPE] = "postgres"

  static [Symbol.hasInstance](value: unknown): boolean {
    return (
      value !== null &&
      typeof value === "object" &&
      POSTGRES_QUERY_TYPE in value
    )
  }

  constructor(name: string, query: string, parameters?: Parameters) {
    this.name = name
    this.query = query
    this.parameters = parameters
  }

  bind(parameters: Parameters): SubmittableQuery<RowType> {
    return new PostgresQuery(this.name, this.query, parameters)
  }
}

export function createPostgresEngine<Database extends SQLDatabaseSchema>(
  database: Database
): DatabaseEngine<Database> {
  if (PG_CLIENT === undefined) {
    throw new Error("Need to initialize pg")
  }

  return createEngine(database, {
    createQuery,
    executeQuery,
  })
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
  const query = args[0]
  if (query instanceof PostgresQuery) {
    const result = await PG_CLIENT!.query(query.query)
    if (result.rows.length > 0) {
      return result.rows as unknown as GetReturnType<Query>
    }

    return result.rowCount as unknown as GetReturnType<Query>
  }

  throw new Error("Unexpected query type for engine")
}
