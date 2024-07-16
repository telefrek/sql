import type { SQLQuery } from "../ast/queries.js"
import type { SQLDatabaseSchema } from "../schema/database.js"
import {
  DefaultBoundQuery,
  type BoundQuery,
  type ParameterizedQuery,
  type SubmittableQuery,
} from "./submittable.js"
import type { GetQueryType, GetReturnType } from "./utils.js"

export type EngineConfig<Database extends SQLDatabaseSchema> = {
  createQuery: <T extends SQLQuery>(
    name: string,
    query: T,
    originalQuery?: string
  ) => GetQueryType<Database, T>

  executeQuery: <Query extends SubmittableQuery | BoundQuery>(
    query: Query
  ) => Promise<GetReturnType<Query>>
}

export type DatabaseEngineExecuteParameters<Query extends SubmittableQuery> =
  Query extends ParameterizedQuery<infer _, infer Parameters>
    ? [query: Query, parameters: Parameters]
    : Query extends SubmittableQuery<infer _>
    ? [query: Query]
    : never

export function createEngine<Database extends SQLDatabaseSchema>(
  database: Database,
  config: EngineConfig<Database>
): DatabaseEngine<Database> {
  return new ConfigurableDatabaseEngine(database, config)
}

export interface DatabaseEngine<Database extends SQLDatabaseSchema> {
  translateQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): GetQueryType<Database, T>

  execute<Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
  ): Promise<GetReturnType<Query>>
}

abstract class AbstractDatabaseEngine<Database extends SQLDatabaseSchema>
  implements DatabaseEngine<Database>
{
  constructor(_database: Database) {}

  translateQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): GetQueryType<Database, T> {
    return this._createQuery(name, query, queryString)
  }

  execute<Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
  ): Promise<GetReturnType<Query>> {
    if (args.length > 1) {
      return this._executeQuery(
        new DefaultBoundQuery(args[0].name, args[0].queryString, args[1]!)
      ) as Promise<GetReturnType<Query>>
    }

    return this._executeQuery(args[0]) as Promise<GetReturnType<Query>>
  }

  protected abstract _createQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): SubmittableQuery

  protected abstract _executeQuery<Query extends SubmittableQuery | BoundQuery>(
    query: Query
  ): Promise<GetReturnType<Query>>
}

class ConfigurableDatabaseEngine<
  Database extends SQLDatabaseSchema
> extends AbstractDatabaseEngine<Database> {
  _createQuery: <T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ) => GetQueryType<Database, T>

  _executeQuery: <Query extends SubmittableQuery | BoundQuery>(
    query: Query
  ) => Promise<GetReturnType<Query>>

  constructor(database: Database, config: EngineConfig<Database>) {
    super(database)

    this._createQuery = config.createQuery
    this._executeQuery = config.executeQuery
  }
}
