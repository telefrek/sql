import type { SQLQuery } from "../ast/queries.js"
import type { BuildActive, SQLReturnRowType } from "../results.js"
import type { SQLDatabaseSchema } from "../schema/database.js"
import type { ParameterizedQuery, SubmittableQuery } from "./submittable.js"

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

export type GetQueryType<
  Database extends SQLDatabaseSchema,
  T extends SQLQuery
> = FlattenQuery<
  SubmittableQuery<
    SQLReturnRowType<BuildActive<Database["tables"], T>, T["query"]>
  >
>

export type SubmittableQueryParamters<P> = [P] extends [never]
  ? []
  : [parameters: P]

export type QueryReturn<RowType> = RowType extends number ? number : RowType[]

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
