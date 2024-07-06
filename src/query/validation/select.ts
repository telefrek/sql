import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { SQLDatabaseTables } from "../../schema/database.js"
import type { AddTableToSchema } from "../../schema/utils.js"
import type { IgnoreEmpty, Invalid } from "../../type-utils/common.js"
import type { StringKeys } from "../../type-utils/object.js"
import type { ValidateSelectColumns } from "./columns.js"

export type ValidateSelectClause<
  Database extends SQLDatabaseTables,
  Select extends SelectClause,
  Active extends SQLDatabaseTables = IgnoreEmpty
> = Select extends SelectClause<infer Columns, infer From>
  ? From extends TableReference<infer Table, infer _>
    ? [Table] extends [StringKeys<Database>]
      ? ValidateSelectColumns<
          AddTableToSchema<Table, Database[Table]["columns"], Active>,
          Columns
        >
      : Invalid<`${Table} is not a table in the referenced schema`>
    : Invalid<"Corrupt from clause">
  : Invalid<"Invalid select clause">
