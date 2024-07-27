import type { Invalid } from "@telefrek/type-utils/common"
import type { Trim } from "@telefrek/type-utils/strings"
import type { TableReference } from "../../ast/tables.js"
import type { CheckQuoteTables, GetQuote, ParserOptions } from "./options.js"
import { tryParseAlias } from "./utils.js"

/**
 * Parse the string as a table reference
 */
export type ParseTableReference<
  Value extends string,
  Options extends ParserOptions
> = ExtractTableReference<Value> extends TableReference<
  infer Table,
  infer Alias
>
  ? CheckQuoteTables<Options> extends true
    ? GetQuote<Options> extends infer Quote extends string
      ? Table extends `${Quote}${infer Name}${Quote}`
        ? Alias extends `${Quote}${infer Updated}${Quote}`
          ? TableReference<Name, Updated>
          : TableReference<Name, Alias>
        : never
      : never
    : TableReference<Table, Alias>
  : ExtractTableReference<Value>

type ExtractTableReference<Value extends string> = Trim<Value> extends ""
  ? Invalid<"Cannot parse empty string as table">
  : Trim<Value> extends `${infer Table} AS ${infer Alias}`
  ? TableReference<Table, Alias>
  : TableReference<Trim<Value>>

/**
 * Parse the table string as a reference
 *
 * @param table the table string to parse
 * @returns A {@link TableReference}
 */
export function parseTableReference(
  tokens: string[],
  options: ParserOptions
): TableReference {
  // Get the table name
  let table = tokens.shift()
  if (table === undefined) {
    throw new Error("Not enough tokens left to parse table reference!")
  }

  if (options.quoteTables) {
    if (table.startsWith(options.quote) && table.startsWith(options.quote)) {
      table = table.slice(1, -1)
    }
  }

  // Return the reference with a potential alias
  return {
    type: "TableReference",
    table,
    alias: tryParseAlias(tokens) ?? table,
  }
}
