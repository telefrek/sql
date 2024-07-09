import type { SQLQuery } from "../ast/queries.js"
import type { BuildActive, SQLReturnRowType } from "../results.js"
import type { SQLDatabaseSchema } from "../schema/database.js"

export type GetQueryParameters<Query extends SubmittableQuery> =
  Query extends SubmittableQuery<infer _, infer Parameters> ? Parameters : never

export type GetReturnType<Query extends SubmittableQuery> =
  Query extends SubmittableQuery<infer Results, infer _>
    ? Results extends number
      ? number
      : Results[]
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
    query: QueryType,
    parameters: GetQueryParameters<Query>
  ) => Promise<GetReturnType<Query>>
}

export function createEngine<
  Database extends SQLDatabaseSchema,
  QueryType extends Omit<SubmittableQuery, "execute">
>(
  database: Database,
  config: EngineConfig<QueryType>
): AbstractDatabaseEngine<Database> {
  return new ConfigurableDatabaseEngine(database, config)
}

export interface DatabaseEngine<Database extends SQLDatabaseSchema> {
  translateQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): GetQueryType<Database, T>

  execute<Query extends SubmittableQuery>(
    query: Query,
    parameters: GetQueryParameters<Query>
  ): Promise<GetReturnType<Query>>
}

export abstract class AbstractDatabaseEngine<
  Database extends SQLDatabaseSchema,
  QueryImplementation extends Omit<SubmittableQuery, "execute"> = Omit<
    SubmittableQuery,
    "execute"
  >
> implements DatabaseEngine<Database>
{
  translateQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): GetQueryType<Database, T> {
    const q = this._createQuery(name, query, queryString)

    return {
      ...q,
      execute: (_: GetQueryType<Database, T>, parameters: never) =>
        this._executeQuery(q, parameters),
    } as unknown as GetQueryType<Database, T>
  }

  execute<Query extends SubmittableQuery>(
    query: Query,
    parameters: GetQueryParameters<Query>
  ): Promise<GetReturnType<Query>> {
    return this._executeQuery(this._checkQuery(query), parameters)
  }

  protected abstract _checkQuery<T extends SubmittableQuery>(
    query: T
  ): QueryImplementation

  protected abstract _createQuery<T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ): QueryImplementation

  protected abstract _executeQuery<Query extends SubmittableQuery>(
    query: QueryImplementation,
    parameters: GetQueryParameters<Query>
  ): Promise<GetReturnType<Query>>
}

/**
 * An object that can be submitted to an engine
 */
export interface SubmittableQuery<
  RowType extends object | number = number,
  Parameters extends object = never
> {
  readonly name: string

  execute(
    parameters: Parameters
  ): Promise<RowType extends number ? number : RowType[]>
}

class ConfigurableDatabaseEngine<
  Database extends SQLDatabaseSchema,
  QueryType extends Omit<SubmittableQuery, "execute">
> extends AbstractDatabaseEngine<Database, QueryType> {
  _checkQuery: <T extends SubmittableQuery>(query: T) => QueryType

  _createQuery: <T extends SQLQuery>(
    name: string,
    query: T,
    queryString?: string
  ) => QueryType

  _executeQuery: <Query extends SubmittableQuery>(
    query: QueryType,
    parameters: GetQueryParameters<Query>
  ) => Promise<GetReturnType<Query>>

  constructor(database: Database, config: EngineConfig<QueryType>) {
    super()

    this._checkQuery = config.checkQuery.bind(this)
    this._createQuery = config.createQuery.bind(this)
    this._executeQuery = config.executeQuery.bind(this)
  }
}
