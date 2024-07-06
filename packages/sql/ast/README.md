# Abstract Syntax Tree

The contents of this package contain the AST for representing SQL queries used
by the rest of the library. It is rougly divided into files with associated
functionality and attempts to keep it limited to just types with little to no
utility methods included given that these are the building blocks of a query.

This AST is not exhaustive for every SQL engine interpretation, but should be
extendable to support variances in the syntax as the use of union types/enums
has been restricted to default values, while the underlying structural types are
simply strings. As an example, the following AST type for a column filter is
expressed as follows:

```TypeScript
/**
 * A filter between two objects
 */
export type ColumnFilter<
  Left extends ColumnReference = ColumnReference,
  Operation extends string = FilteringOperation,
  Right extends ValueTypes | ColumnReference = ValueTypes | ColumnReference,
> = {
  type: "ColumnFilter"
  left: Left
  op: Operation
  right: Right
}
```

The `Operation` type itself is a string, but defaults to the
`FilteringOperation` defined in this package for when there is no override.
