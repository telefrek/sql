import type { Flatten } from "@telefrek/type-utils/common"
import {
  DEFAULT_FILTER_OPS,
  type FilteringOperation,
} from "../../ast/filtering.js"

/**
 * The options for what can be overridden in the parsing logic
 */
export type ParserOptions<
  Tokens extends SyntaxTokens = SyntaxTokens,
  Features extends ParsingFeatures = ParsingFeatures
> = {
  tokens: Tokens
  features: Features[]
}

/**
 * Tokens that have syntatic meaning
 */
export type SyntaxTokens<
  Quote extends string = string,
  FilterOps extends string = FilteringOperation
> = {
  quote: Quote
  filters: FilterOps[]
}

/**
 * Parser features that can be changed
 */
export type ParsingFeatures = "RETURNING" | "QUOTED_TABLES"

/**
 * The default tokens type
 */
type DEFAULT_TOKENS = SyntaxTokens<"'">

/**
 * The default tokens
 */
const DefaultTokens: DEFAULT_TOKENS = {
  quote: "'",
  filters: DEFAULT_FILTER_OPS,
}

/**
 * The default options used if none are provided
 */
export const DefaultOptions = createParsingOptions(
  { quote: "'", filters: DEFAULT_FILTER_OPS },
  "RETURNING"
)

/**
 * the default parser type
 */
export type DEFAULT_PARSER_OPTIONS = typeof DefaultOptions

/**
 * Verify if a feature is enabled
 */
export type CheckFeature<
  Options extends ParserOptions,
  Feature extends ParsingFeatures
> = Options extends ParserOptions<infer _, infer Features>
  ? Feature extends Features
    ? true
    : false
  : false

/**
 * Retrieve the current quote character
 */
export type GetQuote<Options extends ParserOptions> =
  Options extends ParserOptions<infer Tokens, infer _>
    ? Tokens extends SyntaxTokens<infer Quote, infer _>
      ? Quote
      : never
    : never

/**
 * Retrieve the current filter operations
 */
export type GetFilteringOperations<Options extends ParserOptions> =
  Options extends ParserOptions<infer Tokens, infer _>
    ? Tokens extends SyntaxTokens<infer _, infer FilterOps>
      ? FilterOps
      : never
    : never

/**
 * Merge the partial tokens with the default tokens
 */
type MergeTokens<Tokens extends Partial<SyntaxTokens>> = Flatten<
  Tokens & Omit<DEFAULT_TOKENS, keyof Tokens>
> extends SyntaxTokens<infer Quote>
  ? SyntaxTokens<Quote>
  : never

/**
 * Utility to quickly create parser options
 *
 * @param features The features to enable
 * @param quote The quote type
 * @returns A new set of {@link ParserOptions} to use
 */
export function createParsingOptions<
  const Tokens extends Partial<SyntaxTokens>,
  Features extends ParsingFeatures
>(
  tokens: Tokens,
  ...features: Features[]
): ParserOptions<MergeTokens<Tokens>, Features> {
  return {
    tokens: { ...DefaultTokens, ...tokens } as unknown as MergeTokens<Tokens>,
    features,
  }
}
