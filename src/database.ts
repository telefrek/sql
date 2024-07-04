import { QueryParser, type ParseSQL } from "./query/parser/query.js"
import type { CheckQuery } from "./query/validation/query.js"
import type { SQLDatabaseSchema } from "./schema/database.js"

/**
 * Starting point for a SQL Database
 */
export interface SQLDatabase<Schema extends SQLDatabaseSchema> {
  readonly schema: Schema

  parseSQL<T extends string>(query: CheckQuery<T>): ParseSQL<T>
}

export function getDatabase<Schema extends SQLDatabaseSchema>(
  schema: Schema
): SQLDatabase<Schema> {
  const parseSQL = <T extends string>(query: CheckQuery<T>): ParseSQL<T> => {
    return new QueryParser(schema).parse(query as string) as ParseSQL<T>
  }
  return {
    schema,
    parseSQL,
  }
}
