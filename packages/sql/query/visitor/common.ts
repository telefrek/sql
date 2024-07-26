import type { ColumnReference } from "../../ast/columns.js"
import type { InsertClause, QueryClause, SQLQuery } from "../../ast/queries.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { ValueTypes } from "../../ast/values.js"
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

  visitQuery<T extends SQLQuery>(query: Readonly<T>): void {
    this.visitQueryClause(query.query as Readonly<QueryClause>)
  }

  visitQueryClause<T extends QueryClause>(clause: Readonly<T>): void {
    switch (clause.type) {
      case "SelectClause":
        this.visitSelectClause(clause as Readonly<SelectClause>)
        break
      case "InsertClause":
        this.visitInsertClause(clause as Readonly<InsertClause>)
        break
      default:
        throw new Error(`Unsupported QueryClause: ${clause.type}`)
    }
  }

  visitSelectClause<T extends SelectClause>(select: Readonly<T>): void {
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

  visitInsertClause<T extends InsertClause>(insert: Readonly<T>): void {
    // TODO: Lots here and defaults:
    // https://stackoverflow.com/a/2148101/23595914
    this.append(`INSERT INTO ${insert.table.table}`)
    this.enterSubquery(true)

    if (insert.columns.length > 0) {
      for (let n = 0; n < insert.columns.length; ++n) {
        const column = insert.columns[n]
        switch (column.type) {
          case "ColumnReference":
            this.visitColumnReference(column)
            break
          default:
            throw new Error(`Unsupported column type: ${column.type}`)
        }
        if (n < insert.columns.length - 1) {
          this.comma()
        }
      }
    }
    this.exitSubquery()

    if (Array.isArray(insert.values)) {
      this.append("VALUES")
      this.enterSubquery(true)
      for (let n = 0; n < insert.values.length; ++n) {
        const value = insert.values[n]
        this.visitValueType(value)
        if (n < insert.values.length - 1) {
          this.comma()
        }
      }
      this.exitSubquery()
    } else if (
      typeof insert.values === "object" &&
      insert.values !== null &&
      "type" in insert.values
    ) {
      if (insert.values.type === "SelectClause") {
        this.enterSubquery()
        this.visitSelectClause(insert.values)
        this.exitSubquery()
      }
    }

    if ("returning" in insert) {
      this.append("RETURNING")
      if (Array.isArray(insert.returning)) {
        for (let n = 0; n < insert.returning.length; ++n) {
          const column = insert.returning[n] as ColumnReference
          switch (column.type) {
            case "ColumnReference":
              this.visitColumnReference(column)
              break
            default:
              throw new Error(`Unsupported column type: ${column.type}`)
          }
          if (n < insert.returning.length - 1) {
            this.comma()
          }
        }
      } else {
        this.append("*")
      }
    }
  }

  visitTableReference<T extends TableReference>(table: Readonly<T>): void {
    if (table.alias !== table.table) {
      this.append(`${table.table} AS ${table.alias}`)
    } else {
      this.append(table.table)
    }
  }

  visitColumnReference<T extends ColumnReference>(column: Readonly<T>): void {
    if (column.alias !== column.reference.column) {
      super.append(
        `${
          column.reference.type === "TableColumnReference"
            ? `${column.reference.table}.${column.reference.column}`
            : column.reference.column
        } AS ${column.alias}`
      )
    } else {
      super.append(
        column.reference.type === "TableColumnReference"
          ? `${column.reference.table}.${column.reference.column}`
          : column.reference.column
      )
    }
  }

  visitValueType<T extends ValueTypes>(value: T): void {
    switch (value.type) {
      case "StringValue":
        this.appendQuoted(String(value.value))
        break
      case "ArrayValue":
      case "JsonValue":
        this.append(JSON.stringify(value.value))
        break
      case "BufferValue":
        this.append(`0x${value.value!.toString()}`)
        break
      case "NullValue":
        this.append("null")
        break
      default:
        this.append(String(value.value))
        break
    }
  }
}
