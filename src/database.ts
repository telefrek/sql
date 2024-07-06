import { QueryParser, type ParseSQL } from "./query/parser/query.js"
import type { CheckQuery } from "./query/validation/query.js"
import type { SQLDatabaseSchema } from "./schema/database.js"

/**
 * Starting point for a SQL Database
 */
export interface SQLDatabase<Schema extends SQLDatabaseSchema> {
  readonly schema: Schema

  /**
   * Parse SQL and validate it against the database schema
   *
   * @param query The query to parse
   */
  parseSQL<T extends string>(query: CheckQuery<Schema, T>): ParseSQL<T>
}

/**
 * Create a new {@link SQLDatabase} for the given schema
 *
 * @param schema The reference schema to use
 * @returns A {@link SQLDatabase} for the given schema
 */
export function getDatabase<Schema extends SQLDatabaseSchema>(
  schema: Schema
): SQLDatabase<Schema> {
  const parseSQL = <T extends string>(
    query: CheckQuery<Schema, T>
  ): ParseSQL<T> => {
    return new QueryParser(schema).parse(query as string) as ParseSQL<T>
  }
  return {
    schema,
    parseSQL,
  }
}
