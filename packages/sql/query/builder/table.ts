import { ALIAS_REGEX } from "../common.js"
import type { ParserOptions } from "../parser/options.js"
import type { ParseTableReference } from "../parser/table.js"

/**
 * Parse out the table reference
 *
 * @param table The table (or aliased table)
 * @returns A TableReference
 */
export function buildTableReference<
  Table extends string,
  Options extends ParserOptions
>(table: Table, options: Options): ParseTableReference<Table, Options> {
  let name: string = table
  if (options.quoteTables) {
    if (table.startsWith(options.quote) && table.endsWith(options.quote)) {
      name = table.slice(1, -1)
    }
  }

  const ref = {
    type: "TableReference",
    table: name,
    alias: name,
  } as unknown as ParseTableReference<Table, Options>

  if (ALIAS_REGEX.test(table)) {
    const data = table.split(" AS ")

    name = data[0]
    if (options.quoteTables) {
      if (
        data[0].startsWith(options.quote) &&
        data[0].endsWith(options.quote)
      ) {
        name = data[0].slice(1, -1)
      }
    }

    ref.table = name
    ref.alias = data[1]
  }

  return ref
}
