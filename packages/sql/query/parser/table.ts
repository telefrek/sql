import type { TableReference } from "../../ast/tables.js"
import { tryParseAlias } from "./utils.js"

/**
 * Parse the string as a table reference
 */
export type ParseTableReference<Value extends string> =
  Value extends `${infer Table} AS ${infer Alias}`
    ? TableReference<Table, Alias>
    : TableReference<Value>

/**
 * Parse the table string as a reference
 *
 * @param table the table string to parse
 * @returns A {@link TableReference}
 */
export function parseTableReference(tokens: string[]): TableReference {
  // Get the table name
  const table = tokens.shift()
  if (table === undefined) {
    throw new Error("Not enough tokens left to parse table reference!")
  }

  // Return the reference with a potential alias
  return {
    type: "TableReference",
    table,
    alias: tryParseAlias(tokens) ?? table,
  }
}
