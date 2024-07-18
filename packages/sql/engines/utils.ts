import type { SQLQuery } from "../ast/queries.js"
import type { BuildActive } from "../query/validation/query.js"
import { DefaultQueryVisitor } from "../query/visitor/common.js"
import type { QueryAstVisitor, QueryProvider } from "../query/visitor/types.js"
import type { SQLReturnRowType } from "../results.js"
import type { SQLDatabaseSchema } from "../schema/database.js"
import {
  DefaultSubmittableQuery,
  QUERY_PROVIDER_SYMBOL,
  type ParameterizedQuery,
  type SubmittableQuery,
} from "./submittable.js"

/**
 * Custom visitor for engines
 */
export interface EngineVisitor extends QueryAstVisitor, QueryProvider {}

/**
 * Parse a query using a visitor
 *
 * @param name The name of the query
 * @param query The query to inspect
 * @param visitor The visitor to use for generating the SQL
 * @param provider The provider name
 * @returns A fully formed query
 */
export function parseQuery<
  Database extends SQLDatabaseSchema,
  Query extends SQLQuery
>(
  name: string,
  query: Query,
  provider?: string,
  visitor: EngineVisitor = new DefaultQueryVisitor()
): GetQueryType<Database, Query> {
  visitor.visitQuery(query)
  const submittable = new DefaultSubmittableQuery(name, visitor.sql)

  if (provider !== undefined) {
    Object.defineProperty(submittable, QUERY_PROVIDER_SYMBOL, {
      writable: false,
      enumerable: false,
      value: provider,
    })
  }

  return submittable as GetQueryType<Database, Query>
}

/**
 * Extract the parameters from a {@link ParameterizedQuery}
 */
export type GetQueryParameters<Query extends SubmittableQuery> =
  Query extends ParameterizedQuery<infer _, infer Parameters>
    ? Parameters
    : never

/**
 * Extract the return type from a {@link SubmittableQuery}
 */
export type GetReturnType<Query extends SubmittableQuery> =
  Query extends SubmittableQuery<infer Results>
    ? Results extends number
      ? number
      : Results[]
    : never

/**
 * Calculate the row type for a {@link SQLQuery}
 */
export type GetQueryType<
  Database extends SQLDatabaseSchema,
  T extends SQLQuery
> = FlattenQuery<
  SubmittableQuery<
    SQLReturnRowType<BuildActive<Database["tables"], T>, T["query"]>
  >
>

/**
 * Collapse the definition for the query so the IDE looks reasonable
 */
type FlattenQuery<T extends SubmittableQuery> = T extends ParameterizedQuery<
  infer RowType,
  infer Parameters
>
  ? ParameterizedQuery<RowType, Parameters>
  : T extends SubmittableQuery<infer RowType>
  ? SubmittableQuery<RowType>
  : never
