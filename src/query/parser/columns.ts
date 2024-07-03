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

export function parseSelectedColumns(tokens: string[]): {
  columns: SelectColumns | "*"
} {
  const columns = tokens.join(" ").split(" , ")

  if (columns.length === 1 && columns[0] === "*") {
    return {
      columns: "*",
    }
  }

  return {
    columns: columns
      .map((c) => parseColumnReference(c))
      .reduce((v, r) => {
        Object.defineProperty(v, r.alias, { enumerable: true, value: r })
        return v
      }, {}),
  }
}

function parseColumnReference(s: string): ColumnReference {
  const aData = s.split(" AS ")
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
