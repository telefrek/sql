import type { IgnoreEmpty } from "@telefrek/type-utils/common"

/**
 * The type passed by all SQL Parsers responsible for extracting query components
 */
export type PartialParserResult<
  SQL extends string = string,
  Result extends object = IgnoreEmpty
> = {
  sql: SQL
  result: Result
}
