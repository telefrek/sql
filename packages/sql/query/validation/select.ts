import type { IgnoreEmpty, Invalid } from "@telefrek/type-utils/common.js"
import type { StringKeys } from "@telefrek/type-utils/object.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { SQLDatabaseTables } from "../../schema/database.js"
import type { AddTableToSchema } from "../../schema/utils.js"
import type { ValidateSelectColumns } from "./columns.js"

/**
 * Verify if the select clause is valid
 */
export type ValidateSelectClause<
  Database extends SQLDatabaseTables,
  Select extends SelectClause,
  Active extends SQLDatabaseTables = IgnoreEmpty,
> =
  Select extends SelectClause<infer Columns, infer From extends TableReference>
    ? [From["table"]] extends [StringKeys<Database>]
      ? ValidateSelectColumns<
          AddTableToSchema<
            From["alias"],
            Database[From["table"]]["columns"],
            Active
          >,
          Columns
        >
      : Invalid<`${From["table"]} is not a table in the referenced schema`>
    : Invalid<"Invalid select clause">
