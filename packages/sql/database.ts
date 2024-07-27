import {
  DefaultOptions,
  type DEFAULT_PARSER_OPTIONS,
  type ParserOptions,
} from "./query/parser/options.js"
import { QueryParser, type ParseSQL } from "./query/parser/query.js"
import type { VerifyQueryString } from "./query/validation/query.js"
import type { SQLDatabaseSchema } from "./schema/database.js"

/**
 * Starting point for a SQL Database
 */
export interface SQLDatabase<
  Schema extends SQLDatabaseSchema,
  Options extends ParserOptions = DEFAULT_PARSER_OPTIONS,
> {
  readonly schema: Schema

  /**
   * Parse SQL and validate it against the database schema
   *
   * @param query The query to parse
   */
  parseSQL<T extends string>(
    query: VerifyQueryString<Schema, T, Options>,
  ): ParseSQL<T, Options>
}

/**
 * Create a new {@link SQLDatabase} for the given schema
 *
 * @param schema The reference schema to use
 * @returns A {@link SQLDatabase} for the given schema
 */
export function getDatabase<Schema extends SQLDatabaseSchema>(
  schema: Schema,
): SQLDatabase<Schema, DEFAULT_PARSER_OPTIONS>
export function getDatabase<
  Schema extends SQLDatabaseSchema,
  Options extends ParserOptions,
>(schema: Schema, options: Options): SQLDatabase<Schema, Options>
export function getDatabase<
  Schema extends SQLDatabaseSchema,
  Options extends ParserOptions,
>(schema: Schema, options?: Options) {
  const parseSQL = <T extends string>(
    query: VerifyQueryString<Schema, T, Options>,
  ): ParseSQL<T, Options> => {
    return new QueryParser(schema, options ?? DefaultOptions).parse(
      query as string,
    ) as ParseSQL<T, Options>
  }

  return {
    schema,
    parseSQL,
  }
}
