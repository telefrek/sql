/**
 * This is the entrypoint for SQL management
 */

import type { CheckQuery } from "./query/validation/query.js"
import type { SQLDatabaseSchema } from "./schema/database.js"

export { createQueryBuilder } from "./query/builder/query.js"
export type { ParseSQL } from "./query/parser/query.js"
export { createDatabaseSchema } from "./schema/builder/database.js"

/**
 * Starting point for a SQL Database
 */
export interface SQLDatabase<Schema extends SQLDatabaseSchema> {
  readonly schema: Schema

  parseSQL<T extends string>(query: CheckQuery<T>): void
}

export function getDatabase<Schema extends SQLDatabaseSchema>(
  schema: Schema
): SQLDatabase<Schema> {
  return {
    schema,
    parseSQL(_query) {},
  }
}
