import { ALIAS_REGEX } from "../common.js"
import type { ParseTableReference } from "../parser/table.js"

/**
 * Parse out the table reference
 *
 * @param table The table (or aliased table)
 * @returns A TableReference
 */
export function buildTableReference<Table extends string>(
  table: Table
): ParseTableReference<Table> {
  const ref = {
    type: "TableReference",
    table,
    alias: table,
  } as unknown as ParseTableReference<Table>

  if (ALIAS_REGEX.test(table)) {
    const data = table.split(" AS ")
    ref.table = data[0]
    ref.alias = data[1]
  }

  return ref
}
