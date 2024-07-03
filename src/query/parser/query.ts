import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { Invalid } from "../../type-utils/common.js"
import type { NormalizeQuery } from "./normalize.js"
import type { ParseSelect } from "./select.js"

/**
 * Type to parse a SQL string into an AST
 */
export type ParseSQL<T extends string> = CheckSQL<ParseQuery<T>>

/**
 * Type to parse a query segment
 */
export type ParseQuery<T extends string> = ParseSelect<NormalizeQuery<T>>

/**
 * Validate the query structure or pass through the likely Invalid
 */
type CheckSQL<Query> = [Query] extends [never]
  ? Invalid<"not a parsable query">
  : Query extends QueryClause
  ? SQLQuery<Query>
  : Query
