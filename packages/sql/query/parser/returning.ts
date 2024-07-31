import type { Invalid } from "@telefrek/type-utils/common"
import type { ReturningClause } from "../../ast/queries.js"
import type { SelectColumns } from "../../ast/select.js"
import type { ParseSelectedColumns } from "./columns.js"
import type { PartialParserResult } from "./common.js"
import type { CheckFeature, ParserOptions } from "./options.js"

/**
 * Extract the Returning clause if it's present and the feature is enabled
 */
export type ExtractReturning<
  SQL extends string,
  Options extends ParserOptions
> = CheckFeature<Options, "RETURNING"> extends true
  ? SQL extends `${infer QuerySegment} RETURNING ${infer Returning}`
    ? ParseSelectedColumns<Returning, Options> extends infer Columns extends
        | SelectColumns
        | "*"
      ? PartialParserResult<QuerySegment, ReturningClause<Columns>>
      : Invalid<"Failed to extract returning clause">
    : PartialParserResult<SQL>
  : PartialParserResult<SQL>
