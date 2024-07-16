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
> = SubmittableQuery<
  SQLReturnRowType<BuildActive<Database["tables"], T>, T["query"]>
>

type EngineConfig<QueryType extends Omit<SubmittableQuery, "execute">> = {
  checkQuery: <T extends SubmittableQuery>(query: T) => QueryType

  createQuery: <T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ) => QueryType

  executeQuery: <Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
  ) => Promise<GetReturnType<Query>>
}

export type DatabaseEngineExecuteParameters<Query extends SubmittableQuery> =
  Query extends ParameterizedQuery<infer _, infer Parameters>
    ? [query: Query, parameters: Parameters]
    : Query extends SubmittableQuery
    ? [query: Query]
    : never

export function createEngine<
  Database extends SQLDatabaseSchema,
  QueryType extends SubmittableQuery
>(
  database: Database,
  config: EngineConfig<QueryType>
): AbstractDatabaseEngine<Database, QueryType> {
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

export abstract class AbstractDatabaseEngine<
  Database extends SQLDatabaseSchema,
  QueryType extends SubmittableQuery
> implements DatabaseEngine<Database>
{
  translateQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): QueryType {
    return this._createQuery(name, query, queryString)
  }

  execute<Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
  ): Promise<GetReturnType<Query>> {
    args[0] = this._checkQuery(args[0])
    return this._executeQuery(...args)
  }

  protected abstract _checkQuery<T extends SubmittableQuery>(
    query: T
  ): QueryType

  protected abstract _createQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): QueryType

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
  Database extends SQLDatabaseSchema,
  QueryType extends SubmittableQuery
> extends AbstractDatabaseEngine<Database, QueryType> {
  _checkQuery: <T extends SubmittableQuery>(query: T) => QueryType

  _createQuery: <T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ) => QueryType

  _executeQuery: <Query extends SubmittableQuery>(
    ...args: DatabaseEngineExecuteParameters<Query>
  ) => Promise<GetReturnType<Query>>

  constructor(database: Database, config: EngineConfig<QueryType>) {
    super()

    this._checkQuery = config.checkQuery.bind(this)
    this._createQuery = config.createQuery.bind(this)
    this._executeQuery = config.executeQuery.bind(this)
  }
}
