import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  AbstractDatabaseEngine,
  createEngine,
  type DatabaseEngineExecuteParameters,
  type GetReturnType,
  type SubmittableQuery,
} from "@telefrek/sql/engines/common.js"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"
import mysql from "mysql2/promise"

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
      return v ? (UTC_REGEX.test(v) ? Date.parse(v) : safeBigInt(v)) : null
    }
  }

  return next()
}

export function initializeMySQL(conn: mysql.Connection): void {
  MYSQL_CONN = conn
}

export class MySQLQuery {
  readonly name: string
  readonly query: string

  constructor(name: string, query: string) {
    this.name = name
    this.query = query
  }
}

export function createMySQLEngine<Database extends SQLDatabaseSchema>(
  database: Database
): AbstractDatabaseEngine<Database, MySQLQuery> {
  if (MYSQL_CONN === undefined) {
    throw new Error("Need to initialize MySQL")
  }

  return createEngine(database, {
    checkQuery,
    createQuery,
    executeQuery,
  }) as AbstractDatabaseEngine<Database, MySQLQuery>
}

function checkQuery<T extends SubmittableQuery>(query: T): MySQLQuery {
  return query as unknown as MySQLQuery
}

function createQuery<T extends SQLQuery>(
  name: string,
  _query: T,
  queryString?: string
): MySQLQuery {
  return new MySQLQuery(name, queryString ?? "")
}

const SAFE_INT_REGEX = /^(-)?[0-8]?\d{1,15}$/

const safeBigInt = (v: string) => {
  return SAFE_INT_REGEX.test(v)
    ? Number(v) // If number is less than 16 digits that start with a 9 we don't care
    : (v.startsWith("-") ? v.substring(1) : v) > "9007199254740991"
    ? BigInt(v)
    : Number(v)
}

const UTC_REGEX = /\d{4}-\d{2}-\d{2}.?\d{2}:\d{2}:\d{2}.*/

async function executeQuery<Query extends SubmittableQuery>(
  ...args: DatabaseEngineExecuteParameters<Query>
): Promise<GetReturnType<Query>> {
  const [rows] = await MYSQL_CONN!.query({
    sql: checkQuery(args[0]).query,
    typeCast: TYPE_CAST,
  })

  return rows as GetReturnType<Query>
}
