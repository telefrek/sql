/**
 * Where query clause building
 */

import type { Flatten } from "@telefrek/type-utils/common"
import type {
  ColumnReference,
  TableColumnReference,
  UnboundColumnReference,
} from "../../ast/columns.js"
import type {
  ColumnFilter,
  FilteringOperation,
  LogicalExpression,
  LogicalTree,
  WhereClause,
} from "../../ast/filtering.js"
import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { ValueTypes } from "../../ast/values.js"
import type { QueryAST } from "../common.js"
import type {
  ColumnType,
  MatchingColumns,
  QueryContext,
  QueryContextColumns,
} from "../context.js"
import type { ParseColumnReference } from "../parser/columns.js"
import { type CheckValueType, parseValue } from "../parser/values.js"
import { buildColumnReference } from "./select.js"

/**
 * Create a where builder
 *
 * @param context The current context
 * @param query The current query
 * @returns A {@link WhereBuilder}
 */
export function where<Context extends QueryContext, Query extends QueryClause>(
  context: Context,
  query: Query
): WhereBuilder<Context, Query> {
  return new DefaultWhereBuilder(context, query)
}

/**
 * Build a where clause
 */
export interface WhereBuilder<
  Context extends QueryContext,
  Query extends QueryClause
> extends QueryAST<Query> {
  /**
   * Create a where clause
   *
   * @param builder The clause builder
   */
  where<Exp extends LogicalExpression>(
    builder: (w: WhereClauseBuilder<Context>) => Exp
  ): AddWhereToAST<Query, Exp>
}

/**
 * Default implementation of the {@link WhereBuilder}
 */
class DefaultWhereBuilder<
  Context extends QueryContext,
  Query extends QueryClause
> implements WhereBuilder<Context, Query>
{
  private _context: Context
  private _query: Query

  constructor(context: Context, query: Query) {
    this._context = context
    this._query = query
  }

  where<Exp extends LogicalExpression>(
    builder: (w: WhereClauseBuilder<Context>) => Exp
  ): AddWhereToAST<Query, Exp> {
    return {
      ast: {
        type: "SQLQuery",
        query: {
          ...this._query,
          where: builder(whereClause(this._context)),
        },
      },
    } as AddWhereToAST<Query, Exp>
  }

  get ast(): SQLQuery<Query> {
    return {
      type: "SQLQuery",
      query: this._query,
    }
  }
}

export type AddWhereToAST<
  Query extends QueryClause,
  Exp extends LogicalExpression
> = Flatten<Query & WhereClause<Exp>> extends QueryClause
  ? QueryAST<Flatten<Query & WhereClause<Exp>>>
  : never

type Parameter<
  Value,
  Context extends QueryContext,
  Column
> = Value extends `:${infer _}`
  ? Value
  : Value extends `$${infer _}`
  ? Value
  : ColumnType<Context, Column> | MatchingColumns<Context, Column>

type RefType<C extends string> = C extends `${infer Table}.${infer Column}`
  ? ColumnReference<TableColumnReference<Table, Column>>
  : ColumnReference<UnboundColumnReference<C>>

export interface WhereClauseBuilder<Context extends QueryContext> {
  and<Left extends LogicalExpression, Right extends LogicalExpression>(
    left: Left,
    right: Right
  ): LogicalTree<Left, "AND", Right>

  or<Left extends LogicalExpression, Right extends LogicalExpression>(
    left: Left,
    right: Right
  ): LogicalTree<Left, "OR", Right>

  filter<
    Column extends QueryContextColumns<Context>,
    Op extends FilteringOperation,
    Value
  >(
    column: Column,
    op: Op,
    value: Parameter<Value, Context, Column>
  ): ColumnFilter<
    RefType<Column>,
    Op,
    CheckColumnRef<Value, QueryContextColumns<Context>>
  >
}

type CheckColumnRef<Value, Columns extends string> = Value extends Columns
  ? ParseColumnReference<Value>
  : CheckValueType<Value, "'"> extends infer V extends ValueTypes
  ? V
  : never

export function whereClause<Context extends QueryContext>(
  context: Context
): WhereClauseBuilder<Context> {
  return new DefaultWhereClauseBuilder(context)
}

class DefaultWhereClauseBuilder<Context extends QueryContext>
  implements WhereClauseBuilder<Context>
{
  private _context: Context

  constructor(context: Context) {
    this._context = context
  }

  and<Left extends LogicalExpression, Right extends LogicalExpression>(
    left: Left,
    right: Right
  ): LogicalTree<Left, "AND", Right> {
    return {
      type: "LogicalTree",
      left,
      op: "AND",
      right,
    }
  }

  or<Left extends LogicalExpression, Right extends LogicalExpression>(
    left: Left,
    right: Right
  ): LogicalTree<Left, "OR", Right> {
    return {
      type: "LogicalTree",
      left,
      op: "OR",
      right,
    }
  }

  filter<
    Column extends QueryContextColumns<Context>,
    Op extends FilteringOperation,
    Value
  >(
    column: Column,
    op: Op,
    value: Parameter<Value, Context, Column>
  ): ColumnFilter<
    RefType<Column>,
    Op,
    CheckColumnRef<Value, QueryContextColumns<Context>>
  > {
    return buildFilter<Context, Column, Op, Value>(
      this._context,
      column,
      op,
      value as Value
    ) as unknown as ColumnFilter<
      RefType<Column>,
      Op,
      CheckColumnRef<Value, QueryContextColumns<Context>>
    >
  }
}

function buildFilter<
  Context extends QueryContext,
  Column extends string,
  Operation extends FilteringOperation,
  Value
>(
  context: Context,
  column: Column,
  op: Operation,
  value: Value
): ColumnFilter<
  Column extends `${infer Table}.${infer Col}`
    ? ColumnReference<TableColumnReference<Table, Col>, Col>
    : ColumnReference<UnboundColumnReference<Column>, Column>,
  Operation,
  CheckColumnRef<Value, QueryContextColumns<Context>>
> {
  return {
    type: "ColumnFilter",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    left: buildColumnReference(column) as any,
    op,
    right: (isParameter(value)
      ? {
          type: "ParameterValue",
          name: String(value).substring(1),
        }
      : isColumn(context, value)
      ? buildColumnReference(value as string)
      : parseValue(String(value))) as CheckColumnRef<
      Value,
      QueryContextColumns<Context>
    >,
  }
}

function isColumn<Context extends QueryContext, Value>(
  context: Context,
  value: Value
): boolean {
  if (typeof value === "string") {
    if (value.indexOf(".") > 0) {
      const data = value.split(".")
      if (Object.hasOwn(context.active, data[0])) {
        const table = Object.getOwnPropertyDescriptor(
          context.active,
          data[0]
        )?.value
        if (table !== undefined && Object.hasOwn(table["columns"], data[1])) {
          return true
        }
      }
    } else {
      for (const key of Object.keys(context.active)) {
        const table = Object.getOwnPropertyDescriptor(
          context.active,
          key
        )?.value
        if (table !== undefined) {
          for (const col of Object.keys(table["columns"])) {
            if (col === value) {
              return true
            }
          }
        }
      }
    }
  }
  return false
}

function isParameter<T>(value: T): boolean {
  return (
    typeof value === "string" &&
    (value.startsWith(":") || value.startsWith("$"))
  )
}
