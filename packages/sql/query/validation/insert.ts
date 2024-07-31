import type { IgnoreEmpty, Invalid } from "@telefrek/type-utils/common"
import type { StringKeys } from "@telefrek/type-utils/object"
import type { InsertClause } from "../../ast/queries.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { ValueTypes } from "../../ast/values.js"
import type { SQLDatabaseTables } from "../../schema/database.js"
import type { ValidateSelectClause } from "./select.js"

/**
 * Validate the insert clause to ensure that tables and columns exist as well as
 * values matching columns
 */
export type ValidateInsertClause<
  Database extends SQLDatabaseTables,
  Insert extends InsertClause,
  Active extends SQLDatabaseTables = IgnoreEmpty
> = Insert extends InsertClause<infer Into, infer Columns, infer Values>
  ? Into extends TableReference<infer Table, infer _Alias>
    ? [Table] extends [StringKeys<Database>]
      ? Values extends infer V extends ValueTypes[]
        ? Columns["length"] extends V["length"]
          ? true
          : Invalid<"Columns and Values length must match">
        : Values extends infer Select extends SelectClause
        ? ValidateSelectClause<Database, Select, Active> extends true
          ? true // TODO Validate columns match
          : ValidateSelectClause<Database, Select, Active>
        : Invalid<"Invalid subquery, only select is supported for insert">
      : Invalid<`${Table} is not a table in the referenced schema`>
    : Invalid<"Invalid table reference">
  : Invalid<"Invalid insert clause">
