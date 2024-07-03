import type { QueryClause, SQLQuery } from "../../ast/queries.js"
import type { NormalizeQuery } from "./normalize.js"
import type { ParseSelect } from "./select.js"

export type ParseSQL<T extends string> = CheckSQL<
  ParseSelect<NormalizeQuery<T>>
>

type CheckSQL<Query> = Query extends QueryClause ? SQLQuery<Query> : Query
