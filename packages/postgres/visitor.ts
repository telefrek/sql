import type { ColumnReference } from "@telefrek/sql/ast/columns"
import type { TableReference } from "@telefrek/sql/ast/tables"
import { DefaultQueryVisitor } from "@telefrek/sql/query/visitor/common"

/**
 * Extensions for Postgres protocol
 *
 * Notes:
 *
 * 1. We need to make sure to double quote alias values to keep case sensitivity
 */
export class PostgresQueryVisitor extends DefaultQueryVisitor {
  constructor() {
    super()
  }

  override visitTableReference<T extends TableReference>(table: T): void {
    if (table.alias !== table.table) {
      super.append(`${table.table} AS "${table.alias}"`)
    } else {
      super.append(table.table)
    }
  }

  override visitColumnReference<T extends ColumnReference>(
    column: Readonly<T>,
  ): void {
    if (column.alias !== column.reference.column) {
      super.append(
        `${
          column.reference.type === "TableColumnReference"
            ? `${column.reference.table}.${column.reference.column}`
            : column.reference.column
        } AS "${column.alias}"`,
      )
    } else {
      super.append(
        column.reference.type === "TableColumnReference"
          ? `${column.reference.table}.${column.reference.column}`
          : column.reference.column,
      )
    }
  }
}
