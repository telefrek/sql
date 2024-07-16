import type { SQLQuery } from "../ast/queries.js"
import type { BuildActive, SQLReturnRowType } from "../results.js"
import type { SQLDatabaseSchema } from "../schema/database.js"

export type GetQueryParameters<Query extends SubmittableQuery> =
  Query extends ParameterizedQuery<infer _, infer Parameters>
    ? Parameters
    : never

export type GetReturnType<Query extends SubmittableQuery> =
  Query extends SubmittableQuery<infer Results>
    ? Results extends number
      ? number
      : Results[]
    : never

export type GetRowType<Query extends SubmittableQuery> =
  Query extends SubmittableQuery<infer Results>
    ? Results extends number
      ? never
      : Results
    : never

type GetQueryType<
  Database extends SQLDatabaseSchema,
  T extends SQLQuery
> = CheckQuery<
  SubmittableQuery<
    SQLReturnRowType<BuildActive<Database["tables"], T>, T["query"]>
  >
>

type CheckQuery<T> = T extends SubmittableQuery<infer RowType>
  ? SubmittableQuery<RowType>
  : never

type EngineConfig = {
  createQuery: <T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ) => SubmittableQuery

  executeQuery: <Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
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
  config: EngineConfig
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
    return this._executeQuery(...args)
  }

  protected abstract _createQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): SubmittableQuery

  protected abstract _executeQuery<Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
  ): Promise<GetReturnType<Query>>
}

export type SubmittableQueryParamters<P> = [P] extends [never]
  ? []
  : [parameters: P]

export type QueryReturn<RowType> = RowType extends number ? number : RowType[]

/**
 * An object that can be submitted to an engine
 */
export interface SubmittableQuery<
  _RowType extends object | number = object | number
> {
  readonly name: string
}

export interface ParameterizedQuery<
  RowType extends object | number = object | number,
  Parameters extends object = object
> extends SubmittableQuery<RowType> {
  bind(parameters: Parameters): SubmittableQuery<RowType>
}

class ConfigurableDatabaseEngine<
  Database extends SQLDatabaseSchema
> extends AbstractDatabaseEngine<Database> {
  _createQuery: <T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ) => GetQueryType<Database, T>

  _executeQuery: <Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
  ) => Promise<GetReturnType<Query>>

  constructor(database: Database, config: EngineConfig) {
    super(database)

    this._createQuery = config.createQuery.bind(this)
    this._executeQuery = config.executeQuery.bind(this)
  }
}
