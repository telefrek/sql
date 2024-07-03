import type { QueryClause } from "../../ast/queries.js"
import type { ParseQuery } from "../parser/query.js"

/**
 * Type to verify a query is valid to parse
 */
export type CheckQuery<T extends string> = ParseQuery<T> extends QueryClause
  ? T
  : ParseQuery<T>

// TODO: Check against a database schema
