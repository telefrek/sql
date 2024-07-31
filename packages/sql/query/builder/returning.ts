import type { AtLeastOne } from "@telefrek/type-utils/common"
import type { Keys, StringKeys } from "@telefrek/type-utils/object"
import type {
  QueryClause,
  ReturningClause,
  SQLQuery,
} from "../../ast/queries.js"
import type { SQLColumnSchema } from "../../schema/columns.js"
import type { AllowAliasing, QueryAST } from "../common.js"
import { buildColumnReference, type VerifySelectColumns } from "./columns.js"

/**
 * An interface for specifying optional RETURNING clauses
 */
export interface ReturningBuilder<
  Schema extends SQLColumnSchema,
  Query extends QueryClause
> extends QueryAST<Query> {
  /**
   * Choose a subset of the columns to return
   *
   * @param columns The columns to return
   */
  returning<Columns extends AllowAliasing<StringKeys<Schema>>[]>(
    ...columns: AtLeastOne<Columns>
  ): SQLQuery<Query & ReturningClause<VerifySelectColumns<Columns>>>

  /**
   * Return all columns in the row
   */
  returningRow: SQLQuery<Query & ReturningClause<"*">>
}

/**
 * Create a new returning clause builder
 *
 * @param query The query to return from
 * @returns A new {@link ReturningBuilder}
 */
export function createReturningBuilder<
  Schema extends SQLColumnSchema,
  Query extends QueryClause
>(query: Query): ReturningBuilder<Schema, Query> {
  return new DefaultReturningBuilder(query)
}

/**
 * The default {@link ReturningBuilder} implementation
 */
class DefaultReturningBuilder<
  Schema extends SQLColumnSchema,
  Query extends QueryClause
> implements ReturningBuilder<Schema, Query>
{
  private _query: Query
  constructor(query: Query) {
    this._query = query
  }

  returning<Columns extends AllowAliasing<Extract<Keys<Schema>, string>>[]>(
    ...columns: AtLeastOne<Columns>
  ): SQLQuery<Query & ReturningClause<VerifySelectColumns<Columns>>> {
    return {
      type: "SQLQuery",
      query: {
        ...this._query,
        returning: [
          ...columns.map((r) => buildColumnReference(r as unknown as string)),
        ] as VerifySelectColumns<Columns>,
      },
    }
  }

  get returningRow(): SQLQuery<Query & ReturningClause<"*">> {
    return {
      type: "SQLQuery",
      query: {
        ...this._query,
        returning: "*",
      },
    }
  }

  get ast(): SQLQuery<Query> {
    return {
      type: "SQLQuery",
      query: this._query,
    }
  }
}
