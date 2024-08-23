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
  ComparisonOperation,
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
import type { GetQuote, ParserOptions } from "../parser/options.js"
import { type CheckValueType, parseNextValue } from "../parser/values.js"
import { buildColumnReference } from "./select.js"

/**
 * Create a where builder
 *
 * @param context The current context
 * @param query The current query
 * @returns A {@link WhereBuilder}
 */
export function where<
  Context extends QueryContext,
  Query extends QueryClause,
  Options extends ParserOptions
>(
  context: Context,
  query: Query,
  options: Options
): WhereBuilder<Context, Query, Options> {
  return new DefaultWhereBuilder(context, query, options)
}

/**
 * Build a where clause
 */
export interface WhereBuilder<
  Context extends QueryContext,
  Query extends QueryClause,
  Options extends ParserOptions
> extends QueryAST<Query> {
  /**
   * Create a where clause
   *
   * @param builder The clause builder
   */
  where<Exp extends LogicalExpression>(
    builder: (w: WhereClauseBuilder<Context, Options>) => Exp
  ): AddWhereToAST<Query, Exp>
}

/**
 * Default implementation of the {@link WhereBuilder}
 */
class DefaultWhereBuilder<
  Context extends QueryContext,
  Query extends QueryClause,
  Options extends ParserOptions
> implements WhereBuilder<Context, Query, Options>
{
  private _context: Context
  private _query: Query
  private _options: Options

  constructor(context: Context, query: Query, options: Options) {
    this._context = context
    this._query = query
    this._options = options
  }

  where<Exp extends LogicalExpression>(
    builder: (w: WhereClauseBuilder<Context, Options>) => Exp
  ): AddWhereToAST<Query, Exp> {
    return {
      ast: {
        type: "SQLQuery",
        query: {
          ...this._query,
          where: builder(whereClause(this._context, this._options)),
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

export interface WhereClauseBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
> {
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
    Op extends ComparisonOperation,
    Value extends string | number | bigint | boolean | null | undefined
  >(
    column: Column,
    op: Op,
    value: Parameter<Value, Context, Column>
  ): ColumnFilter<
    RefType<Column>,
    Op,
    CheckColumnRef<Value, QueryContextColumns<Context>, Options>
  >
}

type CheckColumnRef<
  Value extends string | number | bigint | boolean | null | undefined,
  Columns extends string,
  Options extends ParserOptions
> = Value extends Columns
  ? ParseColumnReference<Value>
  : CheckValueType<
      `${Value}`,
      GetQuote<Options>
    > extends infer V extends ValueTypes
  ? V
  : never

export function whereClause<
  Context extends QueryContext,
  Options extends ParserOptions
>(context: Context, options: Options): WhereClauseBuilder<Context, Options> {
  return new DefaultWhereClauseBuilder(context, options)
}

class DefaultWhereClauseBuilder<
  Context extends QueryContext,
  Options extends ParserOptions
> implements WhereClauseBuilder<Context, Options>
{
  private _context: Context
  private _options: Options

  constructor(context: Context, options: Options) {
    this._context = context
    this._options = options
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
    Op extends ComparisonOperation,
    Value extends string | number | bigint | boolean | null | undefined
  >(
    column: Column,
    op: Op,
    value: Parameter<Value, Context, Column>
  ): ColumnFilter<
    RefType<Column>,
    Op,
    CheckColumnRef<Value, QueryContextColumns<Context>, Options>
  > {
    return buildFilter<Context, Column, Op, Value, Options>(
      this._context,
      column,
      op,
      value as Value,
      this._options
    ) as unknown as ColumnFilter<
      RefType<Column>,
      Op,
      CheckColumnRef<Value, QueryContextColumns<Context>, Options>
    >
  }
}

function buildFilter<
  Context extends QueryContext,
  Column extends string,
  Operation extends ComparisonOperation,
  Value extends string | number | bigint | boolean | null | undefined,
  Options extends ParserOptions
>(
  context: Context,
  column: Column,
  op: Operation,
  value: Value,
  options: Options
): ColumnFilter<
  Column extends `${infer Table}.${infer Col}`
    ? ColumnReference<TableColumnReference<Table, Col>, Col>
    : ColumnReference<UnboundColumnReference<Column>, Column>,
  Operation,
  CheckColumnRef<Value, QueryContextColumns<Context>, Options>
> {
  return {
    type: "ColumnFilter",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    column: buildColumnReference(column) as any,
    op,
    filter: (isParameter(value)
      ? {
          type: "ParameterValue",
          name: String(value).substring(1),
        }
      : isColumn(context, value)
      ? buildColumnReference(value as string)
      : parseNextValue(String(value).split(" "), options)) as CheckColumnRef<
      Value,
      QueryContextColumns<Context>,
      Options
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
