import type { SQLQuery } from "../ast/queries.js"
import type { SQLDatabaseSchema } from "../schema/database.js"
import {
  DefaultBoundQuery,
  QUERY_PROVIDER_SYMBOL,
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

/**
 * Custom type that leverages tuples and spread syntax to avoid too many overloads
 */
export type QueryExecutionParameters<Query extends SubmittableQuery> =
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

/**
 * An engine that runs SQL queries
 */
export interface DatabaseEngine<
  Database extends SQLDatabaseSchema = SQLDatabaseSchema
> {
  /**
   * Translate an AST into a {@link SubmittableQuery}
   *
   * @param name The name of the query
   * @param query The original query AST
   * @param queryString An optional query string
   */
  translateQuery<Query extends SQLQuery>(
    name: string,
    query: Query,
    queryString?: string
  ): GetQueryType<Database, Query>

  /**
   * Executes the {@link SubmittableQuery} optionally using the parameters
   *
   * @param args The arguments for executing a query
   */
  execute<Query extends SubmittableQuery>(
    ...args: QueryExecutionParameters<Query>
  ): Promise<GetReturnType<Query>>
}

/**
 * Simple class that wraps parameter
 */
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
    ...args: QueryExecutionParameters<Query>
  ): Promise<GetReturnType<Query>> {
    if (args.length > 1) {
      const bound = new DefaultBoundQuery(
        args[0].name,
        args[0].queryString,
        args[1]!
      )

      // Ensure we propogate the provider symbol
      if (QUERY_PROVIDER_SYMBOL in args[0]) {
        Object.defineProperty(bound, QUERY_PROVIDER_SYMBOL, {
          enumerable: false,
          writable: false,
          value: args[0][QUERY_PROVIDER_SYMBOL],
        })
      }

      return this._executeQuery(bound) as Promise<GetReturnType<Query>>
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
