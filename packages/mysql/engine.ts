import type { SQLQuery } from "@telefrek/sql/ast/queries"
import { DatabaseEngine, createEngine } from "@telefrek/sql/engines/common.js"
import type {
  BoundQuery,
  SubmittableQuery,
} from "@telefrek/sql/engines/submittable"
import type { GetReturnType } from "@telefrek/sql/engines/utils"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"
import { parseDateToSafeBigInt } from "@telefrek/sql/types"
import mysql from "mysql2/promise"
import { parseAST } from "./visitor.js"

let MYSQL_CONN: mysql.Connection | undefined

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

export function initializeMySQL(conn: mysql.Connection): void {
  MYSQL_CONN = conn
}

const MYSQL_QUERY_TYPE: unique symbol = Symbol()

export class MySQLQuery<RowType extends object | number = object | number>
  implements SubmittableQuery<RowType>
{
  [MYSQL_QUERY_TYPE] = "mysql"

  static [Symbol.hasInstance](value: unknown): boolean {
    return (
      value !== null && typeof value === "object" && MYSQL_QUERY_TYPE in value
    )
  }

  constructor(readonly name: string, readonly queryString: string) {}
}

export function createMySQLEngine<Database extends SQLDatabaseSchema>(
  database: Database
): DatabaseEngine<Database> {
  if (MYSQL_CONN === undefined) {
    throw new Error("Need to initialize MySQL")
  }

  return createEngine(database, {
    createQuery,
    executeQuery,
  })
}

function createQuery<T extends SQLQuery>(
  name: string,
  query: T,
  queryString?: string
): MySQLQuery {
  return new MySQLQuery(name, parseAST(query, queryString))
}

async function executeQuery<Query extends SubmittableQuery | BoundQuery>(
  query: Query
): Promise<GetReturnType<Query>> {
  if (query instanceof MySQLQuery) {
    const [rows] = await MYSQL_CONN!.query(<mysql.QueryOptions>{
      sql: query.queryString,
      typeCast: TYPE_CAST,
    })
    return rows as GetReturnType<Query>
  }

  throw new Error(`Invalid query supplied to engine`)
}
