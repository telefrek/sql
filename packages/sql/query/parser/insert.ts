import type { Invalid } from "@telefrek/type-utils/common"
import type { InsertClause, ReturningClause } from "../../ast/queries.js"
import { parseColumnReference, parseSelectedColumns } from "./columns.js"
import { extractParenthesis, takeUntil, type NextToken } from "./normalize.js"
import { parseTableReference } from "./table.js"
import { parseValue } from "./values.js"

export type ParseInsert<T extends string> =
  NextToken<T> extends ["INSERT", "INTO", infer _Right extends string]
    ? never
    : Invalid<"Corrupt INSERT INTO syntax">

export function parseInsertClause(
  tokens: string[],
): InsertClause & Partial<ReturningClause> {
  const tableAndValues = takeUntil(tokens, ["COLUMNS", "VALUES", "SELECT"])

  const table = parseTableReference(
    takeUntil(tableAndValues, ["COLUMNS", "VALUES"]).join(" "),
  )

  // Get the columns up until the values or select clause starts
  const columns = takeUntil(tokens, ["VALUES", "SELECT"]).map((c) =>
    parseColumnReference(c),
  )

  const values = extractParenthesis(tokens.slice(1))
    .join(" ")
    .split(" , ")
    .map((v) => parseValue(v.trim()))

  const insert = {
    type: "InsertClause",
    table,
    columns,
    values,
  }

  if (tokens.length > 0 && tokens[0] === "RETURNING") {
    return {
      ...insert,
      returning: parseSelectedColumns(tokens.slice(1)),
    } as unknown as InsertClause & Partial<ReturningClause>
  }

  return insert as InsertClause & Partial<ReturningClause>
}
