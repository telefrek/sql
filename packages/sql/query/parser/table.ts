import type { Trim } from "@telefrek/type-utils/strings"
import type { TableReference } from "../../ast/tables.js"
import type { CheckFeature, ParserOptions } from "./options.js"
import { tryParseAlias, type RemoveQuotes } from "./utils.js"

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
  ? CheckFeature<Options, "QUOTED_TABLES"> extends true
    ? UnQuoteTable<TableReference<Table, Alias>, Options>
    : TableReference<Table, Alias>
  : never

type UnQuoteTable<
  Table extends TableReference,
  Options extends ParserOptions
> = Table extends TableReference<infer Name, infer Alias>
  ? TableReference<RemoveQuotes<Name, Options>, RemoveQuotes<Alias, Options>>
  : never

type ExtractTableReference<Value extends string> = Trim<Value> extends ""
  ? never
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

  if (options.features.indexOf("QUOTED_TABLES") >= 0) {
    if (
      table.startsWith(options.tokens.quote) &&
      table.startsWith(options.tokens.quote)
    ) {
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
