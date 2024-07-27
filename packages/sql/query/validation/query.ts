import type { IgnoreEmpty, Invalid } from "@telefrek/type-utils/common.js"
import type { InsertClause, SQLQuery } from "../../ast/queries.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type {
  SQLDatabaseSchema,
  SQLDatabaseTables,
} from "../../schema/database.js"
import type { ParserOptions } from "../parser/options.js"
import type { ParseSQL } from "../parser/query.js"
import type { ValidateInsertClause } from "./insert.js"
import type { ValidateSelectClause } from "./select.js"

/**
 * Type to verify a query is valid to parse
 */
export type VerifyQueryString<
  Database extends SQLDatabaseSchema,
  T extends string,
  Options extends ParserOptions,
> =
  ParseSQL<T, Options> extends infer Q extends SQLQuery
    ? CheckInvalid<VerifyQuery<Database, Q>, T>
    : Invalid<"Not a valid query string">

/**
 * Utility type to see if the result is true or an invalid so we don't have to
 * calculate types multiple times
 */
type CheckInvalid<T, R> = T extends true ? R : T

/**
 * Explore the query to find all active tables for the main query clause
 */
export type BuildActive<
  Database extends SQLDatabaseTables,
  Query extends SQLQuery,
> =
  Query extends SQLQuery<infer QueryType>
    ? QueryType extends SelectClause<infer _, infer From extends TableReference>
      ? {
          [Key in From["alias"]]: Database[From["table"]]
        }
      : IgnoreEmpty
    : IgnoreEmpty

/**
 * Entrypoint for verifying a query statement
 */
export type VerifyQuery<
  Database extends SQLDatabaseSchema,
  Query extends SQLQuery,
> =
  Query extends SQLQuery<infer Clause>
    ? Clause extends infer Select extends SelectClause
      ? ValidateSelectClause<Database["tables"], Select>
      : Clause extends infer Insert extends InsertClause
        ? ValidateInsertClause<Database["tables"], Insert>
        : Invalid<`Unsupported query type`>
    : Invalid<`Corrupt or invalid SQL query`>
