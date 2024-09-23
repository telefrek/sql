import type { Invalid } from "@telefrek/type-utils/common.js"
import type { Decrement, Increment } from "@telefrek/type-utils/math.js"
import type { Join, Trim } from "@telefrek/type-utils/strings.js"
import { NORMALIZE_TARGETS } from "./keywords.js"
import type { GetOverridableTokens, ParserOptions } from "./options.js"

/**
 * Ensure a query has a known structure with keywords uppercase and consistent spacing
 */
export type NormalizeQuery<
  Query extends string,
  Options extends ParserOptions
> = SplitJoin<Query, "\t"> extends infer Tabs extends string
  ? SplitJoin<Tabs, "\n"> extends infer NewLines extends string
    ? SplitJoin<NewLines, ","> extends infer Commas extends string
      ? SplitJoin<Commas, "("> extends infer OpenParen extends string
        ? SplitJoin<OpenParen, ")"> extends infer Normalized extends string
          ? NormalizeOverrides<Trim<Normalized>, Options>
          : never
        : never
      : never
    : never
  : never

/**
 * Normalize the values by ensuring capitalization
 */
export type NormalizedJoin<T, Keywords = NormalizedKeyWords> = T extends [
  infer Left,
  ...infer Rest
]
  ? Rest extends never[]
    ? Check<Left & string, Keywords>
    : NormalizedJoin<Rest, Keywords> extends infer NJ extends string
    ? `${Check<Left & string, Keywords> & string} ${NJ}`
    : never
  : ""

/**
 * Get the next token from the string (assumes normalized)
 */
export type NextToken<T extends string> =
  Trim<T> extends `${infer Token} ${infer Remainder}`
    ? [Token, Remainder]
    : [Trim<T>, ""]

/**
 * Check if T starts with S (case insensitive)
 */
export type StartsWith<T extends string, S> = NextToken<T> extends [
  infer Left extends string,
  infer _
]
  ? Uppercase<Left> extends S
    ? true
    : false
  : false

/**
 * Split words based on spacing only
 */
export type SplitWords<T> = Trim<T> extends `${infer Left} ${infer Right}`
  ? [...SplitWords<Left>, ...SplitWords<Right>]
  : [Trim<T>]

/**
 * Keep aggregating the next token until the terminator is reached
 */
export type ExtractUntil<
  T extends string,
  K extends string,
  N extends number = 0,
  S extends string = ""
> = NextToken<T> extends [infer Token extends string, infer Rest extends string]
  ? Rest extends ""
    ? [Trim<S>]
    : Token extends "("
    ? ExtractUntil<Rest, K, Increment<N>, `${S} (`>
    : Token extends ")"
    ? ExtractUntil<Rest, K, Decrement<N>, `${S} )`>
    : [Token] extends [K]
    ? N extends 0
      ? [Trim<S>, Trim<`${Token} ${Rest}`>]
      : ExtractUntil<Rest, K, N, `${S} ${Token}`>
    : ExtractUntil<Rest, K, N, `${S} ${Token}`>
  : never

/**
 * Custom split that is SQL aware and respects parenthesis depth
 */
export type SplitSQL<
  T extends string,
  Token extends string = ",",
  S extends string = ""
> = Trim<T> extends `${infer Left} ${Token} ${infer Right}`
  ? CheckEqualParenthesis<`${S} ${Left}`> extends true
    ? SplitSQL<Right, Token> extends infer Tokens extends string[]
      ? [Trim<`${S} ${Left}`>, ...Tokens]
      : Invalid<"Unequal parenthesis">
    : SplitSQL<Right, Token, Trim<`${S} ${Left} ${Token}`>>
  : CheckEqualParenthesis<`${S} ${T}`> extends true
  ? [Trim<`${S} ${T}`>]
  : Invalid<"Unequal parenthesis">

/**
 * This function is responsible for making sure that the query string being
 * processed has a very specific shape.  The rules for that are as follows:
 *
 * 1. All whitespace should be removed and replaced with a single space
 * 2. We want to split based on commas or open/close parenthesis but keep those characters
 * 3. We ensure that each remaining "word" is normalized
 * 4. We combine it all back together as a single collapsed string
 *
 * @param query The query string to normalize
 * @param options The parsing options to use
 * @returns A {@link NormalizeQuery} string
 */
export function normalizeQuery<T extends string, Options extends ParserOptions>(
  query: T,
  options: Options
): NormalizeQuery<T, Options> {
  const keys = new Set<string>()

  options.tokens.arithmetic.forEach((t) => keys.add(t))
  options.tokens.assignments.forEach((t) => keys.add(t))
  options.tokens.comparisons.forEach((t) => keys.add(t))

  return query
    .split(/\s|(?=[,()])|(?<=[,()])/g)
    .filter((s) => s.length > 0)
    .map((s) => normalizeWord(s.trim()))
    .map((s) => splitKeywords(s, Array.from(keys.values())))
    .join(" ") as NormalizeQuery<T, Options>
}

/**
 * Ensure that keywords are appropriately separated out with correct spacing
 *
 * @param word The word to split out filters
 * @param filters The list of candidate filters
 * @returns The patched word with the filter correctly sorted out
 */
function splitKeywords(word: string, filters: string[]): string {
  const filter = filters
    .filter((f) => word.indexOf(f) >= 0)
    .sort((a, b) => (a.length > b.length ? -1 : 1))
    .shift()

  if (filter !== undefined) {
    const data = word.split(filter)
    return (
      data[0].trim() +
      ` ${filter} ` +
      splitKeywords(data[1].trim(), filters)
    ).trim()
  }

  return word
}

/**
 * Ensure that keywords are uppercase so we can process them correctly
 *
 * @param word The word to check against our normalization keys
 * @returns A normalized version of the word
 */
export function normalizeWord(word: string): string {
  return NORMALIZE_TARGETS.indexOf(word.toUpperCase()) < 0
    ? word
    : word.toUpperCase()
}

/**
 * Extract the next tokens until a terminal character is hit or all tokens are processed
 *
 * @param tokens The tokens to process
 * @param terminal The words that terminate the process
 * @returns The next set of tokens between the start and the terminal character
 */
export function takeUntil(tokens: string[], terminal: string[]): string[] {
  const ret = []

  let cnt = 0

  // Don't count tokens that are encountered as part of a subquery between () pairs
  while (tokens.length > 0 && terminal.indexOf(tokens[0]) < 0 && cnt === 0) {
    const token = tokens.shift()!
    ret.push(token)
    if (token === "(") {
      cnt++
    } else if (token === ")") {
      cnt--
    }
  }

  return ret
}

/**
 * Extract the next tokens while one of the filters matches
 *
 * @param tokens The tokens to process
 * @param filters The set of filters to continue consuming
 * @returns The set of tokens that matched the filters
 */
export function takeWhile(tokens: string[], filters: string[]): string[] {
  const ret = []

  let cnt = 0

  while (tokens.length > 0 && filters.indexOf(tokens[0]) >= 0 && cnt === 0) {
    const token = tokens.shift()!
    ret.push(token)
    if (token === "(") {
      cnt++
    } else if (token === ")") {
      cnt--
    }
  }

  return ret
}

/**
 * Extract the next set of parenthesis
 *
 * @param tokens The current tokens
 * @returns The set of tokens between two parenthesis (may have an internal
 * parenthesis pair)
 */
export function extractParenthesis(tokens: string[]): string[] {
  const ret = []

  if (tokens.length === 0 || tokens[0] !== "(") {
    throw new Error(
      `Invalid, does not start with a parenthesis: ${
        tokens.length > 0 ? tokens[0] : "empty array"
      }`
    )
  }
  tokens.shift()

  let cnt = 1
  while (tokens.length > 0 && cnt === 1) {
    const token = tokens.shift()!

    switch (token) {
      case "(":
        cnt++
        ret.push(token)
        break
      case ")":
        {
          if (cnt === 1) {
            cnt = 0
          } else {
            cnt--
            ret.push(token)
          }
        }
        break
      default:
        ret.push(token)
        break
    }
  }

  return ret
}

/**
 * Normalize keywords that can be user provided
 */
type NormalizeOverrides<
  SQL extends string,
  Options extends ParserOptions
> = SplitWords<SQL> extends infer Tokens extends string[]
  ? CleanOverrides<Tokens, Options> extends infer Cleaned extends string[]
    ? Join<Cleaned, " ">
    : never
  : never

/**
 * Clean the overrideable strings
 */
type CleanOverrides<Words, Options extends ParserOptions> = Words extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends never[]
    ? [CheckOverrides<Next, Options>]
    : [CheckOverrides<Next, Options>, ...CleanOverrides<Rest, Options>]
  : never

/**
 * Check for user provided overrides
 */
type CheckOverrides<
  SQL extends string,
  Options extends ParserOptions,
  S extends string = ""
> = SQL extends ""
  ? S
  : GetLongestOverride<SQL, Options> extends infer Override extends string
  ? Override extends ""
    ? SQL extends `${infer Left}${infer Rest}`
      ? CheckOverrides<Rest, Options, `${S}${Left}`>
      : Trim<`${S}${SQL}`>
    : SQL extends `${Override}${infer Rest}`
    ? Trim<`${S} ${Override} ${CheckOverrides<Rest, Options>}`>
    : SQL
  : SQL

type GetLongestOverride<
  SQL extends string,
  Options extends ParserOptions,
  Prefix extends string = "",
  L extends string = ""
> = SQL extends ""
  ? L
  : SQL extends `${infer Left}${infer Rest}`
  ? `${Prefix}${Left}` extends GetOverridableTokens<Options>
    ? GetLongestOverride<Rest, Options, `${Prefix}${Left}`, `${Prefix}${Left}`>
    : GetLongestOverride<Rest, Options, `${Prefix}${Left}`, L>
  : L

/**
 * Test if ( matches ) counts
 */
export type CheckEqualParenthesis<T> = CountOpen<T> extends CountClosed<T>
  ? true
  : false

/**
 * Count the ( characters
 */
type CountOpen<T, N extends number = 0> = T extends `${infer _}(${infer Right}`
  ? CountOpen<Right, Increment<N>>
  : N

/**
 * Count the ) characters
 */
type CountClosed<
  T,
  N extends number = 0
> = T extends `${infer _})${infer Right}` ? CountClosed<Right, Increment<N>> : N

/**
 * Split and then rejoin a string
 */
type SplitJoin<T, C extends string = ","> = SplitTrim<
  T,
  C
> extends infer Tokens extends string[]
  ? Join<Tokens>
  : never

/**
 * Split and trim all the values
 */
type SplitTrim<
  T,
  C extends string = ","
> = Trim<T> extends `${infer Left}${C}${infer Right}`
  ? [...SplitTrim<Left, C>, Trim<C>, ...SplitTrim<Right, C>]
  : Trim<T> extends infer S extends string
  ? SplitWords<S> extends infer Words extends string[]
    ? [NormalizedJoin<Words>]
    : never
  : never

/**
 * Check if a value is a normalized keyword
 */
type Check<T extends string, Keywords> = [Uppercase<Trim<T>>] extends [Keywords]
  ? Uppercase<Trim<T>>
  : Trim<T>

/**
 * Set of keywords we need to ensure casing for
 */
type NormalizedKeyWords =
  | "SELECT"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "FROM"
  | "WHERE"
  | "AS"
  | "JOIN"
  | "INTO"
  | "OUTER"
  | "INNER"
  | "FULL"
  | "HAVING"
  | "LEFT"
  | "RIGHT"
  | "LATERAL"
  | "ORDER"
  | "BY"
  | "LIMIT"
  | "OFFSET"
  | "WITH"
  | "ON"
  | "SET"
  | "UNION"
  | "INTERSECT"
  | "EXCEPT"
  | "MINUS"
