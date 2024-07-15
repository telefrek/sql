import type {
  ColumnReference,
  TableColumnReference,
} from "../../ast/columns.js"
import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import { DefaultQueryProvider, type QueryAstVisitor } from "./types.js"

/**
 * Reference implementation of the QueryAstVisitor and QueryProvider
 */
export class DefaultQueryVisitor
  extends DefaultQueryProvider
  implements QueryAstVisitor
{
  constructor() {
    super()
  }

  visitQuery<T extends SQLQuery>(query: T): void {
    this.visitQueryClause(query.query)
  }

  visitQueryClause<T extends QueryClause>(clause: T): void {
    switch (clause.type) {
      case "SelectClause":
        this.visitSelectClause(clause)
        break
      default:
        throw new Error(`Unsupported QueryClause: ${clause.type}`)
    }
  }

  visitSelectClause<T extends SelectClause>(select: T): void {
    this.append("SELECT")

    // Add the columns
    if (select.columns === "*") {
      this.append("*")
    } else {
      for (let n = 0; n < select.columns.length; ++n) {
        const column = select.columns[n]
        switch (column.type) {
          case "ColumnReference":
            this.visitColumnReference(column)
            break
          default:
            throw new Error(`Unsupported column type: ${column.type}`)
        }
        if (n < select.columns.length - 1) {
          this.comma()
        }
      }
    }

    // Check FROM
    this.append("FROM")
    if (select.from.type === "TableReference") {
      this.visitTableReference(select.from)
    } else {
      throw new Error(`Unuspported named queries on SELECT...FROM`)
    }
  }

  visitTableReference<T extends TableReference>(table: T): void {
    if (table.alias !== table.table) {
      this.append(`${table.table} AS ${table.alias}`)
    } else {
      this.append(table.table)
    }
  }

  visitColumnReference<T extends ColumnReference>(column: T): void {
    if (column.reference.type === "TableColumnReference") {
      this.visitTableColumnReference(column.reference, column.alias)
    } else {
      this.append(
        column.alias !== column.reference.column
          ? `${column.reference.column} AS ${column.alias}`
          : column.reference.column
      )
    }
  }

  visitTableColumnReference<T extends TableColumnReference>(
    reference: T,
    alias?: string
  ): void {
    if (alias && alias !== reference.column) {
      this.append(`${reference.table}.${reference.column} AS ${alias}`)
    } else {
      this.append(`${reference.table}.${reference.column}`)
    }
  }
}
