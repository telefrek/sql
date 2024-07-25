import type { Invalid } from "@telefrek/type-utils/common"
import type { ColumnReference } from "../../ast/columns.js"
import type {
  InsertClause,
  ReturningClause,
  RowGeneratingClause,
} from "../../ast/queries.js"
import type { ValueTypes } from "../../ast/values.js"
import { parseColumnReference } from "./columns.js"
import { extractParenthesis, type NextToken } from "./normalize.js"
import { parseQueryClause } from "./query.js"
import { parseTableReference } from "./table.js"
import { tryParseReturning } from "./utils.js"
import { parseValue } from "./values.js"

export type ParseInsert<T extends string> = NextToken<T> extends [
  "INSERT",
  "INTO",
  infer _Right extends string
]
  ? never
  : Invalid<"Corrupt INSERT INTO syntax">

export function parseInsertClause(
  tokens: string[]
): InsertClause & Partial<ReturningClause> {
  // Parse the table reference first
  const table = parseTableReference(tokens)

  // Extract the columns if they are specified
  const columns = parseColumns(tokens)

  // Parse the values or starting clause
  const values = parseValuesOrSelect(tokens)

  return {
    type: "InsertClause",
    table,
    columns,
    values,
    ...tryParseReturning(tokens),
  }
}

function parseColumns(tokens: string[]): ColumnReference[] {
  if (tokens.length > 0 && tokens[0] === "(") {
    return extractParenthesis(tokens)
      .join(" ")
      .split(" , ")
      .map((c) => parseColumnReference(c.split(" ")))
  }

  return []
}

function parseValuesOrSelect(
  tokens: string[]
): ValueTypes[] | RowGeneratingClause {
  if (tokens[0] === "VALUES") {
    return extractParenthesis(tokens.slice(1))
      .join(" ")
      .split(" , ")
      .map((v) => parseValue(v.trim())) as ValueTypes[]
  }

  const subquery = parseQueryClause(tokens)
  if (subquery.type === "SelectClause") {
    return subquery
  }

  throw new Error(`Unsupported subquery type: ${subquery.type}`)
}
