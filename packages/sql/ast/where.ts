import type { LogicalExpression } from "./expressions.js"

export type WhereClause<
  Expression extends LogicalExpression = LogicalExpression
> = {
  where: Expression
}
