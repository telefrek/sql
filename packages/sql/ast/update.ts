import type { OneOrMore } from "@telefrek/type-utils/common.js"
import type { ColumnArithmeticAssignment } from "./arithmetic.js"
import type { TableReference } from "./tables.js"

/**
 * Structure for an update clause
 */
export type UpdateClause<
  Table extends TableReference = TableReference,
  Columns extends OneOrMore<ColumnArithmeticAssignment> = OneOrMore<ColumnArithmeticAssignment>
> = {
  type: "UpdateClause"
  columns: Columns
  table: Table
}
