import type { TableReference } from "@telefrek/sql/ast/tables"
import { DefaultQueryVisitor } from "@telefrek/sql/query/visitor/common"

/**
 * Extensions for MySQL protocol
 */
export class MySQLQueryVisitor extends DefaultQueryVisitor {
  constructor() {
    super()
  }

  override visitTableReference<T extends TableReference>(table: T): void {
    if (table.alias !== table.table) {
      super.append(`\`${table.table}\` AS ${table.alias}`)
    } else {
      super.appendQuoted(table.table, "`")
    }
  }
}
