import type {
  ColumnReference,
  TableColumnReference,
} from "../../ast/columns.js"
import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { SelectClause } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"

/**
 * A visitor for exploring the SQL AST
 */
export interface QueryAstVisitor {
  /**
   * Visit the query
   *
   * @param query The {@link SQLQuery} to visit
   */
  visitQuery<T extends SQLQuery>(query: T): void

  /**
   * Visit the query clause
   *
   * @param clause The {@link QueryClause} to visit
   */
  visitQueryClause<T extends QueryClause>(clause: T): void

  /**
   * Visit the select clause
   *
   * @param select The {@link SelectClause} to visit
   */
  visitSelectClause<T extends SelectClause>(select: T): void

  /**
   * Visit the table reference
   *
   * @param table the {@link TableReference} to visit
   */
  visitTableReference<T extends TableReference>(table: T): void

  /**
   * Visit the column reference
   *
   * @param column The {@link ColumnReference} to visit
   */
  visitColumnReference<T extends ColumnReference>(column: T): void

  /**
   * Visit the table column reference
   *
   * @param reference The {@link TableColumnReference} to visit
   * @param alias The alias for the column
   */
  visitTableColumnReference<T extends TableColumnReference>(
    reference: T,
    alias?: string,
  ): void
}

/**
 * A query provider
 */
export interface QueryProvider {
  /** The complete SQL text */
  readonly sql: string
}

/**
 * Helper class for implementing a query provider
 */
export abstract class DefaultQueryProvider implements QueryProvider {
  private _sql: string
  protected depth: number = 0

  constructor() {
    this._sql = ""
  }

  get sql(): string {
    return this._sql.trim()
  }

  /**
   * Appends the given text to the query
   *
   * @param text The text to append
   */
  protected append(text: string): void {
    this._sql += `${text} `
  }

  /**
   * Append a comma and remove invalid spacing
   */
  protected comma(): void {
    this._sql = this._sql.trim() + ", "
  }

  /**
   * Append the given text with quotes
   *
   * @param text The text to append
   * @param quote The quote character (defualt is `'`)
   */
  protected appendQuoted(text: string, quote: string = "'"): void {
    this._sql += `${quote}${text}${quote} `
  }

  /**
   * Enter a new subquery
   */
  protected enterSubquery(): void {
    this.depth++
    this._sql += "( "
  }

  /**
   * Exit a current subquery
   */
  protected exitSubquery(): void {
    this.depth--
    this._sql += ") "
  }
}
