import type { Flatten } from "@telefrek/type-utils/common"
import {
  type ArithmeticAssignmentOperation,
  type ArithmeticOperation,
  type ComparisonOperation,
  DEFAULT_ARITHMETIC_ASSIGNMENT_OPS,
  DEFAULT_ARITHMETIC_OPS,
  DEFAULT_COMPARISON_OPS,
} from "../../ast/expressions.js"

/**
 * The options for what can be overridden in the parsing logic
 */
export type ParserOptions<
  Tokens extends SyntaxTokens<string, string, string, string> = SyntaxTokens<
    string,
    string,
    string,
    string
  >,
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
  Comparisons extends string = ComparisonOperation,
  Assignments extends string = ArithmeticAssignmentOperation,
  Arithmetic extends string = ArithmeticOperation
> = {
  quote: Quote
  comparisons: Comparisons[]
  assignments: Assignments[]
  arithmetic: Arithmetic[]
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
  comparisons: DEFAULT_COMPARISON_OPS,
  arithmetic: DEFAULT_ARITHMETIC_OPS,
  assignments: DEFAULT_ARITHMETIC_ASSIGNMENT_OPS,
}

/**
 * The default options used if none are provided
 */
export const DefaultOptions = createParsingOptions(
  {
    quote: "'",
    filters: DEFAULT_COMPARISON_OPS,
    assignments: DEFAULT_ARITHMETIC_ASSIGNMENT_OPS,
    arithmetic: DEFAULT_ARITHMETIC_OPS,
  },
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
    ? Tokens extends SyntaxTokens<infer Quote, infer _, infer _, infer _>
      ? Quote
      : never
    : never

/**
 * Extract all special tokens for normalization
 */
export type GetOverridableTokens<Options extends ParserOptions> =
  | GetComparisonOperations<Options>
  | GetAssignmentOperations<Options>
  | GetArithmeticOperations<Options>

/**
 * Retrieve the current comparison operations
 */
export type GetComparisonOperations<Options extends ParserOptions> =
  Options extends ParserOptions<infer Tokens, infer _>
    ? Tokens extends SyntaxTokens<
        infer _,
        infer ComparisonOps,
        infer _,
        infer _
      >
      ? ComparisonOps
      : never
    : never

/**
 * Retrieve the current arithmetic operations
 */
export type GetArithmeticOperations<Options extends ParserOptions> =
  Options extends ParserOptions<infer Tokens, infer _>
    ? Tokens extends SyntaxTokens<
        infer _,
        infer _,
        infer _,
        infer ArithmeticOps
      >
      ? ArithmeticOps
      : never
    : never

/**
 * Retrieve the current arithmetic assignment operations
 */
export type GetAssignmentOperations<Options extends ParserOptions> =
  Options extends ParserOptions<infer Tokens, infer _>
    ? Tokens extends SyntaxTokens<
        infer _,
        infer _,
        infer AssignmentOps,
        infer _
      >
      ? AssignmentOps
      : never
    : never
/**
 * Merge the partial tokens with the default tokens
 */
type MergeTokens<
  Tokens extends Partial<SyntaxTokens<string, string, string, string>>
> = Flatten<Tokens & Omit<DEFAULT_TOKENS, keyof Tokens>> extends SyntaxTokens<
  infer Quote,
  infer Comparisons,
  infer Assignments,
  infer Arithmetic
>
  ? SyntaxTokens<Quote, Comparisons, Assignments, Arithmetic>
  : never

/**
 * Utility to quickly create parser options
 *
 * @param features The features to enable
 * @param quote The quote type
 * @returns A new set of {@link ParserOptions} to use
 */
export function createParsingOptions<
  const Tokens extends Partial<SyntaxTokens<string, string, string, string>>,
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
