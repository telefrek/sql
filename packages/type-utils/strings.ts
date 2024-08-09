import type { Decrement, GT, Increment, LT } from "./math.js"

/**
 * Join all of the strings using the given join (default ' ')
 */
export type Join<T extends string[], Token extends string = " "> = T extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends never[]
    ? Next
    : Rest extends string[]
    ? `${Next}${Token}${Join<Rest, Token>}`
    : ""
  : ""

/**
 * Trim excess whitespace
 */
export type Trim<Original> = Original extends ` ${infer Rest}`
  ? Trim<Rest>
  : Original extends `\n${infer Rest}`
  ? Trim<Rest>
  : Original extends `\t${infer Rest}`
  ? Trim<Rest>
  : Original extends `\r${infer Rest}`
  ? Trim<Rest>
  : Original extends `${infer Start} `
  ? Trim<Start>
  : Original extends `${infer Start}\n`
  ? Trim<Start>
  : Original extends `${infer Start}\t`
  ? Trim<Start>
  : Original extends `${infer Start}\r`
  ? Trim<Start>
  : Original

/**
 * Split the string using the given token
 */
export type Split<
  Original extends string,
  Token extends string
> = Original extends `${infer Left}${Token}${infer Right}`
  ? [Left, ...Split<Right, Token>]
  : [Original]

/**
 * Find the length of the string
 */
export type StrLen<
  Original extends string,
  N extends number = 0
> = Original extends ""
  ? N
  : Original extends `${infer _}${infer Rest}`
  ? StrLen<Rest, Increment<N>>
  : -1

/**
 * Replace the given values in the string with another
 */
export type Replace<
  Original extends string,
  Token extends string,
  Replacement extends string
> = Original extends `${infer Left}${Token}${infer Right}`
  ? Replace<Right, Token, Replacement> extends infer R extends string
    ? `${Left}${Replacement}${R}`
    : never
  : Original

/**
 * Find the index of the character in the string
 */
export type IndexOf<
  Original extends string,
  Token extends string,
  N extends number = 0
> = Original extends ""
  ? -1
  : Original extends `${Token}${infer _}`
  ? N
  : Original extends `${infer _}${infer Rest}`
  ? IndexOf<Rest, Token, Increment<N>>
  : -1

/**
 * Truncate the first N characters
 */
export type Truncate<
  Original extends string,
  N extends number,
  M extends number = 0
> = M extends N
  ? Original
  : Original extends `${infer _}${infer Rest}`
  ? Truncate<Rest, N, Increment<M>>
  : Original

/**
 * Get the next (Count) characters from the Start
 */
export type Substring<
  Original extends string,
  Start extends number,
  Count extends number = -1
> = GT<Start, 0> extends true
  ? Truncate<Original, Start> extends infer Truncated extends string
    ? Count extends -1
      ? Truncated
      : _Substring<Truncated, Count>
    : never
  : Count extends -1
  ? Original
  : _Substring<Original, Count>

/**
 * Internal helper to build the substrings
 */
type _Substring<
  Original extends string,
  N extends number,
  S extends string = ""
> = N extends 0
  ? S
  : Original extends ""
  ? S
  : Original extends `${infer C}${infer Rest}`
  ? _Substring<Rest, Decrement<N>, `${S}${C}`>
  : never

/**
 * Split into groups with open/close tokens at barriers
 */
export type SplitGroups<
  Original extends string,
  OpenToken extends string,
  CloseToken extends string,
  N extends number = 0,
  C extends string = ""
> = N extends -1 // Unbalanced
  ? never
  : Original extends ""
  ? []
  : IndexOf<Original, OpenToken> extends infer OT extends number
  ? IndexOf<Original, CloseToken> extends infer CT extends number
    ? CT extends OT // both are -1
      ? N extends 0
        ? [Original]
        : never
      : CT extends -1 // No close, only open
      ? never
      : OT extends -1 // Only close, no open
      ? _SplitAt<Original, CT> extends [
          infer Left extends string,
          infer Right extends string
        ]
        ? Decrement<N> extends 0
          ? `${C}${Left}` extends ""
            ? SplitGroups<Right, OpenToken, CloseToken>
            : [`${C}${Left}`, ...SplitGroups<Right, OpenToken, CloseToken>]
          : SplitGroups<
              Right,
              OpenToken,
              CloseToken,
              Decrement<N>,
              `${C}${Left}${CloseToken}`
            >
        : never // No Split
      : _SplitAt<Original, OT, CT> extends [
          infer Left extends string,
          infer Right extends string
        ]
      ? LT<OT, CT> extends true // Open before close
        ? N extends 0
          ? Left extends ""
            ? SplitGroups<Right, OpenToken, CloseToken, 1>
            : [Left, ...SplitGroups<Right, OpenToken, CloseToken, 1>]
          : SplitGroups<
              Right,
              OpenToken,
              CloseToken,
              Increment<N>,
              `${C}${Left}${OpenToken}`
            >
        : N extends 1
        ? `${C}${Left}` extends ""
          ? SplitGroups<Right, OpenToken, CloseToken>
          : [`${C}${Left}`, ...SplitGroups<Right, OpenToken, CloseToken>]
        : SplitGroups<
            Right,
            OpenToken,
            CloseToken,
            Decrement<N>,
            `${C}${Left}${CloseToken}`
          >
      : never
    : never
  : never

/**
 * Split the string at the least of the two indices
 */
type _SplitAt<
  Original extends string,
  OpenIdx extends number,
  CloseIdx extends number = OpenIdx
> = LT<OpenIdx, CloseIdx> extends true
  ? OpenIdx extends 0
    ? ["", Truncate<Original, 1>]
    : [Substring<Original, 0, OpenIdx>, Substring<Original, Increment<OpenIdx>>]
  : CloseIdx extends 0
  ? ["", Truncate<Original, 1>]
  : [Substring<Original, 0, CloseIdx>, Substring<Original, Increment<CloseIdx>>]

/**
 * Utility type to check if there is a partial or unbalanced open/close count
 */
export type IsPartialGroup<
  Original extends string,
  OpenToken extends string,
  CloseToken extends string
> = CountTokens<Original, OpenToken> extends CountTokens<Original, CloseToken>
  ? false
  : true

/**
 * Count the number of times the given token appears in the string
 */
export type CountTokens<
  Original extends string,
  Token extends string,
  N extends number = 0
> = Original extends `${infer _}${Token}${infer Right}`
  ? CountTokens<Right, Token, Increment<N>>
  : N
