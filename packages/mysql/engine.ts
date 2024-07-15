import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  AbstractDatabaseEngine,
  createEngine,
  type DatabaseEngineExecuteParameters,
  type GetReturnType,
  type SubmittableQuery,
} from "@telefrek/sql/engines/common.js"
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
  query: T,
  queryString?: string
): MySQLQuery {
  return new MySQLQuery(name, parseAST(query, queryString))
}

async function executeQuery<Query extends SubmittableQuery>(
  ...args: DatabaseEngineExecuteParameters<Query>
): Promise<GetReturnType<Query>> {
  const options = {
    sql: checkQuery(args[0]).query,
    typeCast: TYPE_CAST,
  }

  const [rows] = await MYSQL_CONN!.query(options)
  return rows as GetReturnType<Query>
}
