import type { QueryClause, SQLQuery } from "../ast/queries.js"

/**
 * Common interface that returns the current AST
 */
export interface QueryAST<Query extends QueryClause = QueryClause> {
  /** Get the current AST */
  ast: SQLQuery<Query>
}

/**
 * Utility type to allow aliasing of the value
 */
export type AllowAliasing<Value extends string> = Value | AliasedValue<Value>

/**
 * A value that can have an alias
 */
export type AliasedValue<Value extends string> = `${Value} AS ${string}`

/** Regex for aliasing */
export const ALIAS_REGEX = /.+ AS .+/

/** Regex for table bound columns */
export const TABLE_BOUND_REGEX = /([^.])+\.([^.])+/
