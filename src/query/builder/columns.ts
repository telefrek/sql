import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "../../ast/columns.js"
import type { SelectClause, SelectColumns } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type {
  SQLDatabaseSchema,
  SQLTableSchema,
} from "../../schema/database.js"
import type { AtLeastOne, Flatten } from "../../type-utils/common.js"
import type { StringKeys } from "../../type-utils/object.js"
import {
  ALIAS_REGEX,
  TABLE_BOUND_REGEX,
  type AllowAliasing,
} from "../common.js"
import type { QueryContext } from "../context.js"
import type { ParseColumnReference } from "../parser/columns.js"
import type { SelectBuilder } from "./select.js"

/**
 * Interface that can provide the columns for a select builder
 */
export interface SelectedColumnsBuilder<
  Database extends SQLDatabaseSchema = SQLDatabaseSchema,
  Context extends QueryContext<Database> = QueryContext<Database>,
  Table extends TableReference = TableReference
> {
  select(
    columns: "*"
  ): SelectBuilder<Database, Context, VerifyColumns<"*">, Table>
  select<
    Columns extends AllowAliasing<GetTableColumns<Context, Table["alias"]>>[]
  >(
    ...columns: AtLeastOne<Columns>
  ): SelectBuilder<Database, Context, VerifyColumns<Columns>, Table>
}

/**
 *
 * @param context The current {@link QueryContext}
 * @param from The {@link TableReference} that is being selected
 * @returns A {@link SelectedColumnsBuilder}
 */
export function createSelectedColumnsBuilder<
  Context extends QueryContext,
  Table extends TableReference
>(
  context: Context,
  from: Table
): SelectedColumnsBuilder<Context["database"], Context, Table> {
  return new DefaultSelectedColumnsBuilder(context, from)
}

/**
 * Default implementation of the {@link SelectedColumnsBuilder}
 */
class DefaultSelectedColumnsBuilder<
  Database extends SQLDatabaseSchema = SQLDatabaseSchema,
  Context extends QueryContext<Database> = QueryContext<Database>,
  Table extends TableReference = TableReference
> implements SelectedColumnsBuilder<Database, Context, Table>
{
  private _context: Context
  private _from: Table

  constructor(context: Context, from: Table) {
    this._context = context
    this._from = from
  }

  select(
    columns: "*"
  ): SelectBuilder<Database, Context, "*", Table, SelectClause<"*", Table>>
  select<Columns extends GetTableColumns<Context, Table["alias"]>>(
    first: Columns,
    ...rest: Columns[]
  ): SelectBuilder<Database, Context, "*", Table, SelectClause<"*", Table>>
  select<
    Columns extends GetTableColumns<Context, Table["alias"]> | "*",
    Selected extends VerifyColumns<Columns>
  >(
    first: Columns,
    ...rest: Columns[]
  ): SelectBuilder<
    Database,
    Context,
    Selected,
    Table,
    SelectClause<Selected, Table>
  > {
    let columns: unknown = "*"

    if (rest.length > 0) {
      columns = [
        buildColumnReference(first),
        ...rest.map((r) => buildColumnReference(r)),
      ].reduce((o, r) => {
        Object.defineProperty(o, r.alias as string, {
          enumerable: true,
          value: r,
          writable: false,
        })
        return o
      }, {})
    } else if (first !== "*") {
      const ref = buildColumnReference(first)
      columns = {}
      Object.defineProperty(columns, ref.alias, {
        enumerable: true,
        writable: false,
        value: ref,
      })
    }

    return {
      ast: {
        type: "SQLQuery",
        query: {
          type: "SelectClause",
          from: this._from,
          columns: columns as Selected,
        },
      },
    }
  }
}

/**
 * Extract the columns from an active table schema
 */
type GetTableColumns<
  Context extends QueryContext,
  Table extends string
> = Context extends QueryContext<infer _DB, infer Active, infer _Returning>
  ? Active[Table] extends SQLTableSchema<infer Schema, infer _Key>
    ? StringKeys<Schema>
    : never
  : never

type TableColumnReferenceType<T extends string> =
  T extends `${infer Table}.${infer Column}`
    ? ColumnReference<TableColumnReference<Table, Column>>
    : never

type VerifyColumns<Columns extends string[] | "*"> = Columns extends string[]
  ? BuildSelectColumns<Columns> extends SelectColumns
    ? BuildSelectColumns<Columns>
    : never
  : "*"

type BuildSelectColumns<Columns extends string[]> = Columns extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends never[]
    ? ParseColumnReference<Next> extends ColumnReference<
        infer Reference,
        infer Alias
      >
      ? {
          [key in Alias]: ColumnReference<Reference, Alias>
        }
      : never
    : Rest extends string[]
    ? ParseColumnReference<Next> extends ColumnReference<
        infer Reference,
        infer Alias
      >
      ? Flatten<
          {
            [key in Alias]: ColumnReference<Reference, Alias>
          } & BuildSelectColumns<Rest>
        >
      : never
    : never
  : never

function buildColumnReference<T extends string>(
  value: T
): ParseColumnReference<T> {
  if (ALIAS_REGEX.test(value)) {
    const data = value.split(" AS ")

    // Build the reference without the alias
    const ref = TABLE_BOUND_REGEX.test(data[0])
      ? (tableColumnReference(data[0]) as ParseColumnReference<T>)
      : (unboundColumnReference(data[0]) as ParseColumnReference<T>)

    // Inject the correct alias
    ref["alias"] = data[1]
    return ref
  }

  return TABLE_BOUND_REGEX.test(value)
    ? (tableColumnReference(value) as unknown as ParseColumnReference<T>)
    : (unboundColumnReference(value) as unknown as ParseColumnReference<T>)
}
function unboundColumnReference<T extends string>(
  column: T
): ColumnReference<UnboundColumnReference<T>> {
  return {
    type: "ColumnReference",
    reference: {
      type: "UnboundColumnReference",
      column,
    },
    alias: column,
  }
}

function tableColumnReference<T extends string>(
  column: T
): TableColumnReferenceType<T> {
  const data = column.split(".")
  return {
    type: "ColumnReference",
    reference: {
      type: "TableColumnReference",
      table: data[0],
      column: data[1],
    },
    alias: data[1],
  } as unknown as TableColumnReferenceType<T>
}
