import type { TableReference } from "../../ast/tables.js"

export type ParseTableReference<Value extends string> =
  Value extends `${infer Table} AS ${infer Alias}`
    ? TableReference<Table, Alias>
    : TableReference<Value>
