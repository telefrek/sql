import type { SQLQuery } from "@telefrek/sql/ast/queries"
import type { TableReference } from "@telefrek/sql/ast/tables"
import { DefaultQueryVisitor } from "@telefrek/sql/query/visitor/common"

export function parseAST<T extends SQLQuery>(
  query: T,
  queryString?: string,
): string {
  const mySQLVisitor = new MySQLQueryVisitor()
  mySQLVisitor.visitQuery(query)

  return mySQLVisitor.sql ?? queryString ?? ""
}

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
