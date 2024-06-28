import type { QueryClause } from "./queries.js"

/**
 * Structure for a with clause
 */
export type WithClause<
  With extends NamedQuery | NamedQuery[] = NamedQuery | NamedQuery[]
> = {
  with: With
}

/**
 * A named query
 */
export type NamedQuery<
  Query extends QueryClause = QueryClause,
  Alias extends string = string
> = {
  type: "NamedQuery"
  query: Query
  alias: Alias
}
