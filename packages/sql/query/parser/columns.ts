import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "../../ast/columns.js"
import type { SelectColumns } from "../../ast/select.js"
import type { SplitSQL } from "./normalize.js"
import { tryParseAlias } from "./utils.js"

/**
 * Parse the selected columns
 */
export type ParseSelectedColumns<Columns extends string> = Columns extends "*"
  ? Columns
  : ParseColumns<SplitSQL<Columns>>

/**
 * Parse the columns that were extracted
 */
type ParseColumns<T> = T extends [infer Column extends string, ...infer Rest]
  ? Rest extends never[]
    ? [ParseColumnReference<Column>]
    : [ParseColumnReference<Column>, ...ParseColumns<Rest>]
  : never

/**
 * Parse the selected columns
 *
 * @param tokens The tokens that represent the select clause
 * @returns A {@link SelectColumns} or '*' depending on the input
 */
export function parseSelectedColumns(tokens: string[]): SelectColumns | "*" {
  // Join everything up and split out the commas
  const columns = tokens.join(" ").split(" , ")

  // If only one column and it's '*' just return that
  if (columns.length === 1 && columns[0] === "*") {
    return "*"
  }

  // Parse out the column references and add them to an empty object
  return columns.map((c) => parseColumnReference(c.split(" "))) as SelectColumns
}

/**
 * Utility type to parse a value as a ColumnReference
 */
export type ParseColumnReference<T extends string> =
  T extends `${infer ColumnDetails} AS ${infer Alias}`
    ? ColumnReference<ParseColumnDetails<ColumnDetails>, Alias>
    : ColumnReference<ParseColumnDetails<T>>

/**
 * Utility type to parse column details
 */
export type ParseColumnDetails<T extends string> =
  T extends `${infer Table}.${infer Column}`
    ? TableColumnReference<Table, Column>
    : UnboundColumnReference<T>

/**
 * Parse a column reference from the given string
 *
 * @param columnReference The column reference to parse
 * @returns A {@link ColumnReference}
 */
export function parseColumnReference(tokens: string[]): ColumnReference {
  const column = tokens.shift()
  if (column === undefined) {
    throw new Error("Failed to parse column from empty token stack")
  }

  const reference = parseReference(column)

  return {
    type: "ColumnReference",
    reference,
    alias: tryParseAlias(tokens) ?? reference.column,
  }
}

/**
 * Parse the underlying reference
 *
 * @param column The column to parse
 * @returns the correct table or unbound reference
 */
function parseReference(
  column: string
): TableColumnReference | UnboundColumnReference {
  // Check for a table reference
  const idx = column.indexOf(".")
  if (idx >= 0) {
    const table = column.substring(0, idx - 1)
    const name = column.substring(idx + 1)
    return {
      type: "TableColumnReference",
      table,
      column: name,
    }
  }

  return {
    type: "UnboundColumnReference",
    column,
  }
}
