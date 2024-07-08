import type { ParseSQL } from "../query/parser/query.js"
import type { CheckQuery } from "../query/validation/query.js"
import type { SQLDatabaseSchema } from "../schema/database.js"

type GetRowType<_T> = number

export type SubmittableQueryBuilder<
  Database extends SQLDatabaseSchema,
  Query extends string
> = (
  query: CheckQuery<Database, Query>
) => SubmittableQuery<GetRowType<ParseSQL<Query>>>

/**
 * An object that can be submitted to an engine
 */
export interface SubmittableQuery<
  _RowType extends object | number,
  _Parameters extends object = never
> {}
