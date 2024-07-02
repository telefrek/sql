import type { QueryClause, SQLQuery } from "../ast/queries.js"

/**
 * Common interface that returns the current AST
 */
export interface QueryAST<Query extends QueryClause = QueryClause> {
  ast: SQLQuery<Query>
}
