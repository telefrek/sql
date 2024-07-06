import type { Invalid } from "@telefrek/type-utils/common.js"
import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { SelectClause } from "../../ast/select.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import type { ParseQuery, ParseSQL } from "../parser/query.js"
import type { ValidateSelectClause } from "./select.js"

/**
 * Type to verify a query is valid to parse
 */
export type CheckQuery<Database extends SQLDatabaseSchema, T extends string> =
  ParseSQL<T> extends SQLQuery<infer Query>
    ? CheckInvalid<VerifyQuery<Database, SQLQuery<Query>>, T>
    : ParseQuery<T> extends QueryClause
      ? CheckInvalid<VerifyQuery<Database, SQLQuery<ParseQuery<T>>>, T>
      : Invalid<"Not a valid query string">

/**
 * Utility type to see if the result is true or an invalid so we don't have to
 * calculate types multiple times
 */
type CheckInvalid<T, R> = T extends true ? R : T

/**
 * Entrypoint for verifying a query statement
 */
type VerifyQuery<Database extends SQLDatabaseSchema, Query extends SQLQuery> =
  Query extends SQLQuery<infer Clause>
    ? Clause extends SelectClause<infer _Columns, infer _From>
      ? ValidateSelectClause<Database["tables"], Clause>
      : Invalid<`Unsupported query type`>
    : Invalid<`Corrupt or invalid SQL query`>
