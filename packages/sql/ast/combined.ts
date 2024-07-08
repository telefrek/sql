import type { OneOrMore } from "@telefrek/type-utils/common.js"
import type { SelectClause } from "./select.js"

/**
 * Ways to combine two select queries
 */
export type CombinedSelectOperation = "UNION" | "INTERSECT" | "MINUS" | "EXCEPT"

/**
 * An operation and additional select clause to apply
 */
export type CombinedSelect<
  Operation extends string = CombinedSelectOperation,
  Next extends SelectClause = SelectClause
> = {
  type: "CombinedSelect"
  op: Operation
  next: Next
}

/**
 * Utliity type to extract the keys from the initial select clause to restrict
 * others to having the same set of keys
 */
type GetSelectKeys<Select extends SelectClause> = Select extends SelectClause<
  infer Columns,
  infer _
>
  ? Columns extends "*"
    ? string
    : Extract<keyof Columns, string>
  : string

/**
 * A chain of select clauses
 */
export type CombinedSelectClause<
  Original extends SelectClause = SelectClause,
  Additions extends OneOrMore<
    CombinedSelect<GetSelectKeys<Original>>
  > = OneOrMore<CombinedSelect<GetSelectKeys<Original>>>
> = {
  type: "CombinedSelectClause"
  original: Original
  additions: Additions
}
