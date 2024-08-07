import type { AtLeastOne } from "@telefrek/type-utils/common.js"
import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "../../ast/columns.js"
import type { SQLQuery } from "../../ast/queries.js"
import type { SelectClause, SelectColumns } from "../../ast/select.js"
import type { TableReference } from "../../ast/tables.js"
import type { SQLDatabaseSchema } from "../../schema/database.js"
import {
  ALIAS_REGEX,
  TABLE_BOUND_REGEX,
  type AllowAliasing,
  type QueryAST,
} from "../common.js"
import type { GetSelectableColumns, QueryContext } from "../context.js"
import type { ParseColumnReference } from "../parser/columns.js"

/**
 * Interface that can provide the columns for a select builder
 */
export interface SelectedColumnsBuilder<
  Context extends QueryContext = QueryContext,
  Table extends TableReference = TableReference,
> extends QueryAST<SelectClause<"*", Table>> {
  /**
   * Choose the columns that we want to include in the select
   *
   * @param columns The set of columns to select
   */
  columns<Columns extends AllowAliasing<GetSelectableColumns<Context>>[]>(
    ...columns: AtLeastOne<Columns>
  ): QueryAST<SelectClause<VerifySelectColumns<Columns>, Table>>
}

/**
 *
 * @param context The current {@link QueryContext}
 * @param from The {@link TableReference} that is being selected
 * @returns A {@link SelectedColumnsBuilder}
 */
export function createSelectedColumnsBuilder<
  Context extends QueryContext,
  Table extends TableReference,
>(context: Context, from: Table): SelectedColumnsBuilder<Context, Table> {
  return new DefaultSelectedColumnsBuilder(context, from)
}

/**
 * Default implementation of the {@link SelectedColumnsBuilder}
 */
class DefaultSelectedColumnsBuilder<
  Database extends SQLDatabaseSchema = SQLDatabaseSchema,
  Context extends QueryContext<Database> = QueryContext<Database>,
  Table extends TableReference = TableReference,
> implements SelectedColumnsBuilder<Context, Table>
{
  private _context: Context
  private _from: Table

  constructor(context: Context, from: Table) {
    this._context = context
    this._from = from
  }

  get ast(): SQLQuery<SelectClause<"*", Table>> {
    return {
      type: "SQLQuery",
      query: {
        type: "SelectClause",
        from: this._from,
        columns: "*",
      },
    }
  }

  columns<Columns extends AllowAliasing<GetSelectableColumns<Context>>[]>(
    ...columns: AtLeastOne<Columns>
  ): QueryAST<SelectClause<VerifySelectColumns<Columns>, Table>> {
    return {
      ast: {
        type: "SQLQuery",
        query: {
          type: "SelectClause",
          from: this._from,
          columns: [
            ...columns.map((r) => buildColumnReference(r as unknown as string)),
          ] as VerifySelectColumns<Columns>,
        },
      },
    }
  }
}

type TableColumnReferenceType<T extends string> =
  T extends `${infer Table}.${infer Column}`
    ? ColumnReference<TableColumnReference<Table, Column>>
    : never

export type VerifyColumnReferences<Columns extends string[]> =
  BuildSelectColumns<Columns> extends infer R extends ColumnReference[]
    ? R
    : never

export type VerifySelectColumns<Columns extends string[] | "*"> =
  Columns extends string[]
    ? BuildSelectColumns<Columns> extends SelectColumns
      ? BuildSelectColumns<Columns>
      : never
    : "*"

type BuildSelectColumns<Columns extends string[]> = Columns extends [
  infer Next extends string,
  ...infer Rest,
]
  ? Rest extends never[]
    ? [ParseColumnReference<Next>]
    : Rest extends string[]
      ? [ParseColumnReference<Next>, ...BuildSelectColumns<Rest>]
      : never
  : never

export function buildColumnReference<T extends string>(
  value: T,
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
  column: T,
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
  column: T,
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
