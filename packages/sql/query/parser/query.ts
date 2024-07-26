import type { Invalid } from "@telefrek/type-utils/common.js"
import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import { createQueryBuilder, type QueryBuilder } from "../builder/query.js"
import type { QueryContext } from "../context.js"
import { parseInsertClause, type ParseInsert } from "./insert.js"
import { normalizeQuery, type NormalizeQuery } from "./normalize.js"
import type { DEFAULT_PARSER_OPTIONS, ParserOptions } from "./options.js"
import { parseSelectClause, type ParseSelect } from "./select.js"

/**
 * Type to parse a SQL string into an AST
 */
export type ParseSQL<
  T extends string,
  Options extends ParserOptions = DEFAULT_PARSER_OPTIONS
> = CheckSQL<ParseQuery<T, Options>>

/**
 * Type to parse a query segment
 */
export type ParseQuery<
  T extends string,
  Options extends ParserOptions
> = NormalizeQuery<T> extends infer Q extends string
  ? Q extends `SELECT ${string}`
    ? ParseSelect<Q, Options>
    : Q extends `INSERT INTO ${string}`
    ? ParseInsert<Q, Options>
    : Invalid<`Query is not valid or supported`>
  : never

/**
 * Validate the query structure or pass through the likely Invalid
 */
type CheckSQL<Query> = [Query] extends [never]
  ? Invalid<"not a parsable query">
  : Query extends QueryClause
  ? SQLQuery<Query>
  : Query

/**
 * Class to help with Query parsing
 */
export class QueryParser<
  Database extends SQLDatabaseSchema,
  Options extends ParserOptions
> {
  private _database: Database
  private _options: Options

  constructor(database: Database, options: Options) {
    this._database = database
    this._options = options
  }

  /**
   * Retrieve the query builder at this point in time
   */
  get builder(): QueryBuilder<QueryContext<Database>, Options> {
    return createQueryBuilder(this._database, this._options)
  }

  /**
   * Parse the given query into an AST
   *
   * @param query The query to parse
   * @returns A fully parsed SQL query
   */
  parse<T extends string>(query: T): ParseSQL<T> {
    return {
      type: "SQLQuery",
      query: parseQueryClause(normalizeQuery(query).split(" ")),
    } as ParseSQL<T>
  }
}

/**
 * Parse the query clause
 *
 * NOTE: This does NOT check anything for validity as that should be done via
 * the type system.  If called outside of this context things WILL break
 *
 * @param s the string to parse
 * @returns A generic SQLQuery
 */

export function parseQueryClause(tokens: string[]): QueryClause {
  const check = tokens.shift()
  if (check === undefined) {
    throw new Error("Cannot parse empty string as query")
  }

  switch (check) {
    case "SELECT":
      return parseSelectClause(tokens)
    case "INSERT":
      return parseInsertClause(tokens.slice(1))
    default:
      throw new Error(`Cannot parse ${check}`)
  }
}
