import type { SelectClause, SelectColumns } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import type { QueryAST } from "../common.js"
import type { QueryContext } from "../context.js"

export interface SelectBuilder<
  Database extends SQLDatabaseSchema = SQLDatabaseSchema,
  _Context extends QueryContext<Database> = QueryContext<Database>,
  Columns extends "*" | SelectColumns = "*" | SelectColumns,
  Table extends TableReference = TableReference,
  Query extends SelectClause<Columns, Table> = SelectClause<Columns, Table>
> extends QueryAST<Query> {}
