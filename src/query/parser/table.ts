import type { NamedQuery } from "../../ast/named.js"
import type { TableReference } from "../../ast/tables.js"

/**
 * Parse the string as a table reference
 */
export type ParseTableReference<Value extends string> =
  Value extends `${infer Table} AS ${infer Alias}`
    ? TableReference<Table, Alias>
    : TableReference<Value>

/**
 * Parse the tokens into the correct table or subquery object
 *
 * @param tokens The tokens of the from clause
 * @returns A from clause
 */
export function parseFrom(tokens: string[]): {
  from: TableReference | NamedQuery
} {
  // We need to remove the from which is still part of the query
  if (tokens.shift() !== "FROM") {
    throw new Error("Corrupt query")
  }

  // TODO: Parse named queries...
  return {
    from: parseTableReference(tokens.join(" ")),
  }
}

/**
 * Parse the table string as a reference
 *
 * @param table the table string to parse
 * @returns A {@link TableReference}
 */
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
