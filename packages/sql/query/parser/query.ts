import type { Invalid } from "@telefrek/type-utils/common.js"
import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import { createQueryBuilder, type QueryBuilder } from "../builder/query.js"
import type { QueryContext } from "../context.js"
import { normalizeQuery, type NormalizeQuery } from "./normalize.js"
import { parseSelectClause, type ParseSelect } from "./select.js"

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

/**
 * Class to help with Query parsing
 */
export class QueryParser<Database extends SQLDatabaseSchema> {
  private _database: Database

  constructor(database: Database) {
    this._database = database
  }

  /**
   * Retrieve the query builder at this point in time
   */
  get builder(): QueryBuilder<QueryContext<Database>> {
    return createQueryBuilder(this._database)
  }

  /**
   * Parse the given query into an AST
   *
   * @param query The query to parse
   * @returns A fully parsed SQL query
   */
  parse<T extends string>(query: T): ParseSQL<T> {
    return parseQueryClause(normalizeQuery(query)) as ParseSQL<T>
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

function parseQueryClause(s: string): SQLQuery {
  const tokens = s.split(" ")
  switch (tokens.shift()!) {
    case "SELECT":
      return {
        type: "SQLQuery",
        query: parseSelectClause(tokens),
      }
    default:
      throw new Error(`Cannot parse ${s}`)
  }
}
