import type { Invalid } from "@telefrek/type-utils/common.js"
import type { Dec, Inc } from "@telefrek/type-utils/numbers.js"
import type { Join, Trim } from "@telefrek/type-utils/strings.js"
import { NORMALIZE_TARGETS } from "./keywords.js"

/**
 * Ensure a query has a known structure with keywords uppercase and consistent spacing
 */
export type NormalizeQuery<T> = SplitJoin<
  SplitJoin<SplitJoin<SplitJoin<SplitJoin<T, "\t">, "\n">, ",">, "(">,
  ")"
>

/**
 * Normalize the values by ensuring capitalization
 */
export type NormalizedJoin<T, Keywords = NormalizedKeyWords> = T extends [
  infer Left,
  ...infer Rest
]
  ? Rest extends never[]
    ? Check<Left & string, Keywords>
    : `${Check<Left & string, Keywords> & string} ${NormalizedJoin<
        Rest,
        Keywords
      > &
        string}`
  : ""

/**
 * Get the next token from the string (assumes normalized)
 */
export type NextToken<T extends string> =
  Trim<T> extends `${infer Token} ${infer Remainder}`
    ? [Token, Remainder]
    : [Trim<T>, ""]

/**
 * Utility type for extracting clauses and remainders
 */
export type Extractor<U> = [clause: U | never, remainder: string]

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
  N = 0,
  S extends string = ""
> = NextToken<T> extends [infer Token extends string, infer Rest extends string]
  ? Rest extends ""
    ? [Trim<S>]
    : Token extends "("
    ? ExtractUntil<Rest, K, Inc<N>, `${S} (`>
    : Token extends ")"
    ? ExtractUntil<Rest, K, Dec<N>, `${S} )`>
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
> = T extends `${infer Left} ${Token} ${infer Right}`
  ? EqualParenthesis<`${S} ${Left}`> extends true
    ? [Trim<`${S} ${Left}`>, ...SplitSQL<Trim<Right>, Token>]
    : SplitSQL<Right, Token, Trim<`${S} ${Left} ${Token}`>>
  : EqualParenthesis<`${S} ${T}`> extends true
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
 * @returns A {@link NormalizeQuery} string
 */
export function normalizeQuery<T extends string>(query: T): NormalizeQuery<T> {
  return query
    .split(/\s|(?=[,()])|(?<=[,()])/g)
    .filter((s) => s.length > 0)
    .map((s) => normalizeWord(s.trim()))
    .join(" ") as NormalizeQuery<T>
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
 * Test if ( matches ) counts
 */
type EqualParenthesis<T> = CountOpen<T> extends CountClosed<T> ? true : false

/**
 * Count the ( characters
 */
type CountOpen<T, N extends number = 0> = T extends `${infer _}(${infer Right}`
  ? CountOpen<Right, Inc<N>>
  : N

/**
 * Count the ) characters
 */
type CountClosed<
  T,
  N extends number = 0
> = T extends `${infer _})${infer Right}` ? CountClosed<Right, Inc<N>> : N

/**
 * Split and then rejoin a string
 */
type SplitJoin<T, C extends string = ","> = Join<SplitTrim<T, C>>

/**
 * Split and trim all the values
 */
type SplitTrim<
  T,
  C extends string = ","
> = Trim<T> extends `${infer Left}${C}${infer Right}`
  ? [...SplitTrim<Left, C>, Trim<C>, ...SplitTrim<Right, C>]
  : [NormalizedJoin<SplitWords<Trim<T>>>]

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
