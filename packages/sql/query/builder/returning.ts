import type { AtLeastOne } from "@telefrek/type-utils/common"
import type { Keys, StringKeys } from "@telefrek/type-utils/object"
import type {
  QueryClause,
  ReturningClause,
  SQLQuery,
} from "../../ast/queries.js"
import type { SQLColumnSchema } from "../../schema/columns.js"
import type { AllowAliasing, QueryAST } from "../common.js"
import type { VerifySelectColumns } from "./columns.js"

export interface ReturningBuilder<
  Schema extends SQLColumnSchema,
  Query extends QueryClause
> extends QueryAST<Query> {
  returning<Columns extends AllowAliasing<StringKeys<Schema>>[]>(
    ...columns: AtLeastOne<Columns>
  ): SQLQuery<Query & ReturningClause<VerifySelectColumns<Columns>>>

  returningRow: SQLQuery<Query & ReturningClause<"*">>
}

export function createReturningBuilder<
  Schema extends SQLColumnSchema,
  Query extends QueryClause
>(query: Query): ReturningBuilder<Schema, Query> {
  return new DefaultReturningBuilder(query)
}

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
    throw new Error("Method not implemented.")
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
