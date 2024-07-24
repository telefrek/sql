import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "../../ast/columns.js"
import type { SelectColumns } from "../../ast/select.js"

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
 * Parse the selected columns
 *
 * @param tokens The tokens that represent the select clause
 * @returns A {@link SelectColumns} or '*' depending on the input
 */
export function parseSelectedColumns(tokens: string[]): {
  columns: SelectColumns | "*"
} {
  // Join everything up and split out the commas
  const columns = tokens.join(" ").split(" , ")

  // If only one column and it's '*' just return that
  if (columns.length === 1 && columns[0] === "*") {
    return {
      columns: "*",
    }
  }

  // Parse out the column references and add them to an empty object
  return {
    columns: columns.map((c) => parseColumnReference(c)) as SelectColumns,
  }
}

/**
 * Parse a column reference from the given string
 *
 * @param columnReference The column reference to parse
 * @returns A {@link ColumnReference}
 */
export function parseColumnReference(columnReference: string): ColumnReference {
  const aData = columnReference.split(" AS ")
  const cData = aData[0].split(".")

  const table = cData.length > 1 ? cData[0] : undefined
  const column = cData.length > 1 ? cData[1] : cData[0]
  const alias = aData.length > 1 ? aData[1] : column

  return {
    type: "ColumnReference",
    reference:
      table === undefined
        ? {
            type: "UnboundColumnReference",
            column,
          }
        : {
            type: "TableColumnReference",
            table,
            column,
          },
    alias,
  }
}
