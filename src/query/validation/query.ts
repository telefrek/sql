import type { SQLQuery } from "../../ast/queries.js"
import type { SelectClause } from "../../ast/select.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import type { Invalid } from "../../type-utils/common.js"
import type { ParseQuery, ParseSQL } from "../parser/query.js"
import type { ValidateSelectClause } from "./select.js"

/**
 * Type to verify a query is valid to parse
 */
export type CheckQuery<
  Database extends SQLDatabaseSchema,
  T extends string
> = ParseSQL<T> extends SQLQuery<infer QueryClause>
  ? CheckInvalid<VerifyQuery<Database, SQLQuery<QueryClause>>, T>
  : ParseQuery<T>

type CheckInvalid<T, R> = T extends true ? R : T

type VerifyQuery<
  Database extends SQLDatabaseSchema,
  Query extends SQLQuery
> = Query extends SQLQuery<infer Clause>
  ? Clause extends SelectClause<infer _Columns, infer _From>
    ? ValidateSelectClause<Database["tables"], Clause>
    : Invalid<`Unsupported query type`>
  : Invalid<`Corrupt or invalid SQL query`>
