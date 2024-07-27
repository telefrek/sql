```
   _ (`-.    ('-.     _  .-')    .-')                 .-') _
  ( (OO  )  ( OO ).-.( \( -O )  ( OO ).              ( OO ) )
 _.`     \  / . --. / ,------. (_)---\_)  ,-.-') ,--./ ,--,'  ,----.
(__...--''  | \-.  \  |   /`. '/    _ |   |  |OO)|   \ |  |\ '  .-./-')
 |  /  | |.-'-'  |  | |  /  | |\  :` `.   |  |  \|    \|  | )|  |_( O- )
 |  |_.' | \| |_.'  | |  |_.' | '..`''.)  |  |(_/|  .     |/ |  | .--, \
 |  .___.'  |  .-.  | |  .  '.'.-._)   \ ,|  |_.'|  |\    | (|  | '. (_/
 |  |       |  | |  | |  |\  \ \       /(_|  |   |  | \   |  |  '--'  |
 `--'       `--' `--' `--' '--' `-----'   `--'   `--'  `--'   `------'
```

# Parsing Mechanics

When we are parsing SQL, there are a few rules and patterns that we want to keep in mind
to keep the solution clean and manageable.

1. We don't care THAT much about algorithmic efficiency. Since parsing
   shouldn't be done nearly as often as execution for any SQL how we get from
   `string` to `SQLQuery` isn't a huge runtime barrier.
2. We will bias towards strategies that make it easier for the TypeScript
   compiler to operate. The entire goal of having compile time feedback is
   HIGHLY dependent on getting fast feedback.
3. We will try to match functions to types as much as possible to make the code
   easier to follow. Since the type system handles `#2` and `#1` says we don't
   care about the runtime implications (within reason) it's better for learning
   and troubleshooting later to keep them in alignment.

The code is structured in a way that attempts to group common or shared
functionality into the same files. If you are trying to find something that is
only related to `SELECT` clauses, it should be in the `select.ts` file. Types
should also be located in the same file as their functional equivalent to make
searching easier.

# Common Patterns

You will see some of the following patterns throughout the parsing code,
depending on whether you are looking at the functional or type only
implementations.

## Splitting

Since we don't have access to substring style functions and numeric indicies, we
have to rely a lot more on string template type inferrence. Where you might
normally have code that looks like this to break apart the SQL segment:

```typescript
const segment = "a, b, c FROM d"
const idx = segment.indexOf("FROM")
if (idx >= 0) {
  const columns = segment.substring(0, idx - 1)
  const from = segment.substring(idx + 4)
} else {
  throw new Error("Failed to find FROM")
}
```

The type only implementation will instead look like:

```typescript
type SplitFrom<Segment extends string> =
  Segment extends `${infer Columns extends string}FROM${infer From extends string}`
    ? [Columns, From]
    : Invalid<"Failed to locate FROM">
```

These two are procedurally the same but they look different due to the way we
have to express them. This is a common pattern in the type system which you
will come across frequently.

## Token Stacks vs Strings

One area where there is an intentional difference between the types and
functional code is how parameters are passed. In the type system, you are
likely to see most types get a `string` parameter when parsing an object but the
functional components will get a `string[]` parameter instead. The main reason
for this is that we can more easily pass around a stack of strings and modify
them through `shift` operations across multiple functions instead of having to
explicitly pass parameters around. Since the type system is keeping track of
some extract hidden context for us, we can leverage that in our types to infer a
lot of data that we would have to explicitly defined in a functional world.

```typescript
/**
 * Parse a column reference from the given string
 *
 * @param columnReference The column reference to parse
 * @returns A {@link ColumnReference}
 */
export function parseColumnReference(tokens: string[]): ColumnReference {
  const column = tokens.shift()
  if (column === undefined) {
    throw new Error("Failed to parse column from empty token stack")
  }

  const reference = parseReference(column)

  return {
    type: "ColumnReference",
    reference,
    alias: tryParseAlias(tokens) ?? reference.column,
  }
}

/**
 * Parse the underlying reference
 *
 * @param column The column to parse
 * @returns the correct table or unbound reference
 */
function parseReference(
  column: string,
): TableColumnReference | UnboundColumnReference {
  // Check for a table reference
  const idx = column.indexOf(".")
  if (idx >= 0) {
    const table = column.substring(0, idx - 1)
    const name = column.substring(idx + 1)
    return {
      type: "TableColumnReference",
      table,
      column: name,
    }
  }

  return {
    type: "UnboundColumnReference",
    column,
  }
}
```

This allows us to modify the `tokens` with some "hidden" behaviors across method
calls. We can cleanly have some utility methods for extracting alias types,
table references and other shared behaviors without having to worry about giving
them too much or too little of the string. In the type system, we can be way
more explicit about grabbing the chunks we need to accomplish the same task
which makes them simpler to just write with strings:

```typescript
/**
 * Utility type to parse a value as a ColumnReference
 */
export type ParseColumnReference<T extends string> =
  T extends `${infer ColumnDetails} AS ${infer Alias}`
    ? ColumnReference<ParseColumnDetails<ColumnDetails>, Alias>
    : ColumnReference<ParseColumnDetails<T>>

/**
 * Utility type to parse column details
 */
export type ParseColumnDetails<T extends string> =
  T extends `${infer Table}.${infer Column}`
    ? TableColumnReference<Table, Column>
    : UnboundColumnReference<T>
```
