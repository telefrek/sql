import type { Invalid, OneOrMore } from "../type-utils/common.js"
import type { ColumnReference } from "./columns.js"
import type { TableReference } from "./tables.js"
import type { ValueTypes } from "./values.js"

/**
 * This is a helper type to instruct TypeScript to stop exploring the recursive
 * chains that come from assignment trees that are nested by nature.  Since an
 * AssignmentTree an contain an AssignmentTree, it creates a circular type which
 * we need to avoid.  This simply tells TypeScript to leave it alone and we'll
 * have to deal with the potential for bad data via our ValidateAssignmenTree type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAssignmentTree = AssignmentTree<any, string, any>

/**
 * Utility type to verify a LogicalTree doesn't have invalid data
 */
export type ValidateAssignmentTree<Tree> = Tree extends AssignmentTree<
  infer Left,
  infer Op,
  infer Right
>
  ? AssignmentTree<Left, Op, Right>
  : Invalid<"Tree is not an AssignmentTree">

/**
 * Operation to modify a column using a value
 */
export type AssignmentOperation =
  | "="
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "&"
  | "|"
  | "^"
  | "+="
  | "-="
  | "*="
  | "/="
  | "%="
  | "&="

/**
 * An abstract expression for column assignment
 */
export type AssignmentExpression =
  | ValueTypes
  | ColumnReference
  | AnyAssignmentTree

/**
 * Represents a tree of assignment operations to facilitate combinations of
 * parameters, values and other column manipulations to get a final value
 */
export type AssignmentTree<
  Left extends AssignmentExpression = AssignmentExpression,
  Operation extends string = AssignmentOperation,
  Right extends AssignmentExpression = AssignmentExpression
> = {
  type: "AssignmentTree"
  left: Left
  op: Operation
  right: Right
}

/**
 * Structure for an update clause
 */
export type UpdateClause<
  Table extends TableReference = TableReference,
  Columns extends OneOrMore<ColumnAssignment> = OneOrMore<ColumnAssignment>
> = {
  type: "UpdateClause"
  columns: Columns
  table: Table
}

/**
 * A column can be assigned to a value that can be a combination of parameters,
 * other columns or simple values
 */
export type ColumnAssignment<
  Column extends ColumnReference = ColumnReference,
  Assignment extends AssignmentExpression = AssignmentExpression
> = {
  type: "ColumnAssignment"
  column: Column
  assignment: Assignment
}
