import type { SQLQuery } from "@telefrek/sql/ast/queries"
import {
  AbstractDatabaseEngine,
  createEngine,
  type DatabaseEngineExecuteParameters,
  type GetReturnType,
  type ParameterizedQuery,
  type SubmittableQuery,
} from "@telefrek/sql/engines/common.js"
import type { SQLDatabaseSchema } from "@telefrek/sql/schema/database.js"
import { parseDateToSafeBigInt } from "@telefrek/sql/types"
import mysql from "mysql2/promise"
import { inspect } from "util"
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

const MY_SQL_QUERY_TYPE: unique symbol = Symbol()

export class MySQLQuery<
  RowType extends object | number = object | number,
  Parameters extends object = never
> implements ParameterizedQuery<RowType, Parameters>
{
  [MY_SQL_QUERY_TYPE] = "mysql"

  static [Symbol.hasInstance](value: unknown): boolean {
    return (
      value !== null && typeof value === "object" && MY_SQL_QUERY_TYPE in value
    )
  }

  readonly query: string
  readonly name: string
  readonly parameters?: Parameters

  constructor(name: string, query: string, parameters?: Parameters) {
    this.name = name
    this.query = query
    this.parameters = parameters
  }

  bind(parameters: Parameters): SubmittableQuery<RowType> {
    return new MySQLQuery(this.name, this.query, parameters)
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
  if (query instanceof MySQLQuery) {
    return query
  }

  console.log(inspect(query, true, 10, true))

  throw new Error("Invalid query: expected MySQLQuery")
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
  const query = checkQuery(args[0])

  const [rows] = await MYSQL_CONN!.query(<mysql.QueryOptions>{
    sql: query.query,
    typeCast: TYPE_CAST,
  })
  return rows as GetReturnType<Query>
}
