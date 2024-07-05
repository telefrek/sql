import type { Invalid } from "../../type-utils/common.js"
import type { Dec, Inc } from "../../type-utils/numbers.js"
import type { Join, Trim } from "../../type-utils/strings.js"
import { NORMALIZE_TARGETS } from "./keywords.js"

/**
 * Ensure a query has a known structure with keywords uppercase and consistent spacing
 */
export type NormalizeQuery<T> = SplitJoin<
  SplitJoin<SplitJoin<SplitJoin<T, "\n">, ",">, "(">,
  ")"
>

/**
 * Normalize the values by ensuring capitalization
 */
export type NormalizedJoin<T, Keywords = NormalizedKeyWords> = T extends [
  infer Left,
  ...infer Rest,
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
export type NextToken<T> =
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
export type StartsWith<T, S> =
  NextToken<T> extends [infer Left, infer _]
    ? Uppercase<Left & string> extends S
      ? true
      : false
    : false

/**
 * Split words based on spacing only
 */
export type SplitWords<T> =
  Trim<T> extends `${infer Left} ${infer Right}`
    ? [...SplitWords<Left>, ...SplitWords<Right>]
    : [Trim<T>]

/**
 * Keep aggregating the next token until the terminator is reached
 */
export type ExtractUntil<T, K, N = 0, S extends string = ""> =
  NextToken<T> extends [infer Token, infer Rest]
    ? Rest extends ""
      ? [Trim<S>]
      : Token extends "("
        ? ExtractUntil<Rest, K, Inc<N>, `${S} (`>
        : Token extends ")"
          ? ExtractUntil<Rest, K, Dec<N>, `${S} )`>
          : [Uppercase<Token & string>] extends [K]
            ? N extends 0
              ? [Trim<S>, Trim<`${Token & string} ${Rest & string}`>]
              : ExtractUntil<Rest, K, N, `${S} ${Token & string}`>
            : ExtractUntil<Rest, K, N, `${S} ${Token & string}`>
    : never

/**
 * Custom split that is SQL aware and respects parenthesis depth
 */
export type SplitSQL<
  T,
  Token extends string = ",",
  S extends string = "",
> = T extends `${infer Left} ${Token} ${infer Right}`
  ? EqualParenthesis<`${S} ${Left}`> extends true
    ? [Trim<`${S} ${Left}`>, ...SplitSQL<Trim<Right>, Token>]
    : SplitSQL<Right, Token, Trim<`${S} ${Left} ${Token}`>>
  : EqualParenthesis<`${S} ${T & string}`> extends true
    ? [Trim<`${S} ${T & string}`>]
    : Invalid<"Unequal parenthesis">

export function normalize<T extends string>(s: T): NormalizeQuery<T> {
  return s
    .split(/ |\n|(?=[,()])|(?<=[,()])/g)
    .filter((s) => s.length > 0)
    .map((s) => normalizeWord(s.trim()))
    .join(" ") as NormalizeQuery<T>
}

export function normalizeWord(s: string): string {
  return NORMALIZE_TARGETS.indexOf(s.toUpperCase()) < 0 ? s : s.toUpperCase()
}

export function takeUntil(tokens: string[], filters: string[]): string[] {
  const ret = []

  let cnt = 0

  while (tokens.length > 0 && filters.indexOf(tokens[0]) < 0 && cnt === 0) {
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
  N extends number = 0,
> = T extends `${infer _})${infer Right}` ? CountClosed<Right, Inc<N>> : N

/**
 * Split and then rejoin a string
 */
type SplitJoin<T, C extends string = ","> = Join<SplitTrim<T, C>>

/**
 * Split and trim all the values
 */
type SplitTrim<T, C extends string = ","> =
  Trim<T> extends `${infer Left}${C}${infer Right}`
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
