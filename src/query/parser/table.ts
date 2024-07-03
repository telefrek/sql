import type { NamedQuery } from "../../ast/named.js"
import type { TableReference } from "../../ast/tables.js"

export type ParseTableReference<Value extends string> =
  Value extends `${infer Table} AS ${infer Alias}`
    ? TableReference<Table, Alias>
    : TableReference<Value>

export function parseFrom(tokens: string[]): {
  from: TableReference | NamedQuery
} {
  if ("FROM" !== tokens.shift()) {
    throw new Error("Invalid from tokens")
  }

  // TODO: Parse named queries...
  return {
    from: parseTableReference(tokens.join(" ")),
  }
}

function parseTableReference(table: string): TableReference {
  if (table.indexOf(" AS ") > 0) {
    const data = table.split(" AS ")
    return {
      type: "TableReference",
      table: data[0],
      alias: data[1],
    }
  }

  return {
    type: "TableReference",
    table,
    alias: table,
  }
}
