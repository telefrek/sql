import { DatabaseEngine, createEngine } from "@telefrek/sql/engines/common.js"
import {
  QUERY_PROVIDER_SYMBOL,
  type BoundQuery,
  type SubmittableQuery,
} from "@telefrek/sql/engines/submittable"
import { parseQuery, type GetReturnType } from "@telefrek/sql/engines/utils"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"
import { parseDateToSafeBigInt } from "@telefrek/sql/types"
import mysql from "mysql2/promise"
import { DRIVER_ID } from "./index.js"
import { MySQLQueryVisitor } from "./visitor.js"

let MYSQL_CONN: mysql.Connection | undefined

/**
 * A type cast to match our TypeScript values
 *
 * @param field The field to parse
 * @param next The next method to call
 * @returns The value of the field
 */
const TYPE_CAST: mysql.TypeCast = (field, next) => {
  switch (field.type) {
    case "DECIMAL":
    case "NEWDECIMAL":
    case "TIMESTAMP":
    case "TIMESTAMP2":
    case "LONG":
    case "LONGLONG": {
      const v = field.string("utf-8")
      return v ? parseDateToSafeBigInt(v) : v
    }
  }

  return next()
}

/**
 * Initialize our test engine
 *
 * @param conn The connection to use
 */
export function initializeMySQL(conn: mysql.Connection): void {
  MYSQL_CONN = conn
}

/**
 * Create a MySQL engine to use
 *
 * @param database The database schema to use
 * @returns A {@link DatabaseEngine} for MySQL
 */
export function createMySQLEngine<Database extends SQLDatabaseSchema>(
  database: Database,
): DatabaseEngine<Database> {
  if (MYSQL_CONN === undefined) {
    throw new Error("Need to initialize MySQL")
  }

  return createEngine(database, {
    createQuery(name, query, _originalQuery) {
      return parseQuery(name, query, DRIVER_ID, new MySQLQueryVisitor())
    },
    executeQuery,
  })
}

/**
 * Execute the query
 *
 * @param query The query to execute
 * @returns The results of the query execution
 */
async function executeQuery<Query extends SubmittableQuery | BoundQuery>(
  query: Query,
): Promise<GetReturnType<Query>> {
  if (
    QUERY_PROVIDER_SYMBOL in query &&
    query[QUERY_PROVIDER_SYMBOL] === DRIVER_ID
  ) {
    const [rows] = await MYSQL_CONN!.query(<mysql.QueryOptions>{
      sql: query.queryString,
      typeCast: TYPE_CAST,
    })
    return rows as GetReturnType<Query>
  }

  throw new Error(`Invalid query supplied to engine`)
}
