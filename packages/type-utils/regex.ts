import type { IgnoreAny } from "./common.js"
import type { GTE, Increment, LTE } from "./math.js"
import type { IsPartialGroup, Replace, Split, SplitGroups } from "./strings.js"

/**
 * Validate the candidate against the regex and return the candidate if there is
 * a match
 */
export type ValidateRegEx<
  Regex extends string,
  Candidate extends string
> = IsMatch<Regex, Candidate> extends true
  ? Candidate
  : "Candidate does not match supplied Regex"

/**
 * Verify if the given candidate matches the regex
 */
export type IsMatch<
  Regex extends string,
  Candidate extends string
> = RegEx<Regex> extends infer Tree extends RegexToken
  ? RunStateMachine<Candidate, Tree>
  : false

/**
 * Parse the regex tree from the current point down
 */
export type RegEx<RegEx extends string> = IsLeaf<RegEx> extends true
  ? CollapseRegexTokens<
      ParseRegex<RegEx>
    > extends infer Tokens extends RegexToken[]
    ? Tokens extends [infer SingleToken extends RegexToken]
      ? SingleToken
      : RegexGroupToken<Tokens>
    : never
  : SplitAlternates<RegEx> extends [RegEx] // No alternates
  ? CollapseRegexTokens<
      TranslateGroups<SplitCaptureGroups<RegEx>>
    > extends infer Tokens extends RegexToken[]
    ? Tokens extends [infer SingleToken extends RegexToken]
      ? SingleToken
      : RegexGroupToken<Tokens>
    : never
  : CollapseRegexTokens<
      CollapseAlternates<SplitAlternates<RegEx>>
    > extends infer Alternates extends RegexToken[]
  ? CollapseRegexTokens<
      BuildAlternates<Alternates>
    > extends infer Tokens extends RegexToken[]
    ? Tokens extends [infer SingleToken extends RegexToken]
      ? SingleToken
      : RegexGroupToken<Tokens>
    : never
  : never

/**
 * Verify if the number is in range after failing a match check (Min <= N <= Max)
 */
type InRange<N extends number, Min extends number, Max extends number> = GTE<
  N,
  Min
> extends true
  ? Max extends -1
    ? true
    : LTE<N, Max> extends true
    ? true
    : false
  : false

/**
 * Take associated columns (like repetitions)
 */
type CollapseRegexTokens<Tokens> = Tokens extends [
  infer First extends RegexToken,
  infer Second,
  ...infer Rest
]
  ? Second extends RegexRepeatingToken<never, infer Min, infer Max>
    ? Rest extends never[]
      ? [RegexRepeatingToken<First, Min, Max>]
      : [RegexRepeatingToken<First, Min, Max>, ...CollapseRegexTokens<Rest>]
    : Rest extends never[]
    ? [First, Second]
    : [First, ...CollapseRegexTokens<[Second, ...Rest]>]
  : Tokens

/**
 * Parse the full regex, extracting one token at a time
 */
type ParseRegex<RegEx extends string> = RegEx extends ""
  ? []
  : NextToken<RegEx> extends [infer Token, infer Remainder extends string]
  ? Remainder extends ""
    ? [Token]
    : ParseRegex<Remainder> extends infer Tokens extends unknown[]
    ? [Token, ...Tokens]
    : [Token]
  : never

/**
 * Check to see if a regex is structural or a leaf node
 */
type IsLeaf<RegEx extends string> = SplitAlternates<RegEx> extends [RegEx]
  ? SplitCaptureGroups<RegEx> extends [RegEx]
    ? true
    : false
  : false

/**
 * Fast check for SplitGroups with the correct tokens
 */
type SplitCaptureGroups<RegEx extends string> =
  RegEx extends `${infer _}\\(${infer _}`
    ? FixCaptures<
        SplitGroups<
          Replace<Replace<RegEx, "\\(", "$__first__$">, "\\)", "$__second__$">,
          "(",
          ")"
        >
      >
    : SplitGroups<RegEx, "(", ")">

/**
 * Fix mangled captures for escaped parenthesis
 */
type FixCaptures<Captures> = Captures extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends []
    ? [Replace<Replace<Next, "$__first__$", "\\(">, "$__second__$", "\\)">]
    : [
        Replace<Replace<Next, "$__first__$", "\\(">, "$__second__$", "\\)">,
        ...FixCaptures<Rest>
      ]
  : never

/**
 * Extract a group of tokens
 */
type ExtractGroup<Original extends string> = IsLeaf<Original> extends true
  ? CollapseRegexTokens<
      ParseRegex<Original>
    > extends infer Tokens extends RegexToken[]
    ? ValidateGroup<Tokens>
    : never
  : [RegEx<Original>]

type ValidateGroup<Tokens extends RegexToken[]> = Tokens extends [
  infer SingleToken extends RegexToken
]
  ? [SingleToken]
  : Tokens extends [
      infer Repeating extends RegexRepeatingToken<never, number, number>,
      ...infer Rest extends RegexToken[]
    ]
  ? [Repeating, ...ValidateGroup<Rest>]
  : [RegexGroupToken<Tokens>]

/**
 * Build the alternates from the groups
 */
type BuildAlternates<Alternates> = Alternates extends [
  infer First extends RegexToken,
  infer Second extends RegexToken,
  ...infer Rest
]
  ? BuildAlternates<
      [RegexAlternateToken<First, Second>, ...Rest]
    > extends infer Tokens extends RegexToken[]
    ? Tokens
    : never
  : Alternates

/**
 * Collapse all of the alternates that were found
 */
type CollapseAlternates<Tokens> = Tokens extends [
  infer First extends string,
  ...infer Rest
]
  ? CollapseRegexTokens<
      TranslateGroups<SplitCaptureGroups<First>>
    > extends infer Groups extends RegexToken[]
    ? Rest extends never[]
      ? ValidateGroup<Groups>
      : CollapseAlternates<Rest> extends infer Alternates extends RegexToken[]
      ? Groups extends [infer Token extends RegexToken]
        ? [Token, ...Alternates]
        : [...ValidateGroup<Groups>, ...Alternates]
      : never
    : never
  : never

/**
 * Translate all groups
 */
type TranslateGroups<Groups> = Groups extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends never[]
    ? [...ExtractGroup<Next>]
    : TranslateGroups<Rest> extends infer Tokens extends RegexToken[]
    ? [...ExtractGroup<Next>, ...Tokens]
    : never
  : never

/**
 * Split out all alternate groups
 */
type SplitAlternates<RegEx extends string> =
  RegEx extends `${infer _}\\|${infer _}`
    ? FixAlternates<
        Split<Replace<RegEx, "\\|", "$__alt__$">, "|">
      > extends infer Tokens extends string[]
      ? RejoinPartial<Tokens, "|">
      : never
    : Split<RegEx, "|"> extends infer Tokens extends string[]
    ? RejoinPartial<Tokens, "|">
    : never

/**
 * Fix any alternate escaping
 */
type FixAlternates<Alternates> = Alternates extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends never[]
    ? [Replace<Next, "$__alt__$", "\\|">]
    : [Replace<Next, "$__alt__$", "\\|">, ...FixAlternates<Rest>]
  : never

/**
 * Restore partial groups that might be affected by a split on '|'
 */
type RejoinPartial<Tokens, C extends string> = Tokens extends [
  infer First extends string,
  infer Second extends string,
  ...infer Rest
]
  ? IsPartialGroup<First, "(", ")"> extends true
    ? RejoinPartial<[`${First}${C}${Second}`, ...Rest], C>
    : [First, ...RejoinPartial<[Second, ...Rest], C>]
  : Tokens

/**
 * Read the next regex token from the string
 */
type NextToken<RegEx extends string> =
  RegEx extends `{${infer Repeating}}${infer Unparsed}`
    ? [ParseRepeating<Repeating>, Unparsed]
    : RegEx extends `[${infer Group}]${infer Unparsed}`
    ? ParseRange<Group> extends infer Token extends string
      ? [RegexRangeToken<Token>, Unparsed]
      : "Invalid range"
    : RegEx extends `${infer Special extends REGEX_SPECIAL_TOKENS}${infer Unparsed}`
    ? [CheckSpecial<Special>, Unparsed]
    : RegEx extends `\\${infer Literal}${infer Unparsed}`
    ? [CheckLiteral<Literal>, Unparsed]
    : RegEx extends `${infer Literal}${infer Unparsed}`
    ? [RegexLiteralToken<Literal>, Unparsed]
    : never

/** Set of special characters */
type REGEX_SPECIAL_TOKENS = "." | "+" | "*" | "?"

// Special ranges or tokens for matching
type REGEX_ANY = RegexRangeToken<string>
type REGEX_WORD = RegexRangeToken<ParseRange<"a-zA-Z0-9_">>
type REGEX_DIGIT = RegexRangeToken<ParseRange<"0-9">>
type REGEX_WHITESPACE = RegexRangeToken<"\t" | " ">

type REGEX_ONE_OR_MORE = RegexRepeatingToken<never, 1, -1>
type REGEX_ZERO_OR_MORE = RegexRepeatingToken<never, 0, -1>
type REGEX_ZERO_OR_ONE = RegexRepeatingToken<never, 0, 1>

/**
 * Map special character sets
 */
type CheckSpecial<Special extends REGEX_SPECIAL_TOKENS> = Special extends "."
  ? REGEX_ANY
  : Special extends "+"
  ? REGEX_ONE_OR_MORE
  : Special extends "*"
  ? REGEX_ZERO_OR_MORE
  : Special extends "?"
  ? REGEX_ZERO_OR_ONE
  : never

/**
 * Check literal escape vs supported sets
 */
type CheckLiteral<Literal extends string> = Literal extends "w"
  ? REGEX_WORD
  : Literal extends "s"
  ? REGEX_WHITESPACE
  : Literal extends "d"
  ? REGEX_DIGIT
  : RegexLiteralToken<Literal> // Check a word

/**
 * Parse a repeating token: {2,3}
 */
type ParseRepeating<Repeating extends string> =
  Repeating extends `${infer Min extends number},${infer Max extends number}`
    ? RegexRepeatingToken<never, Min, Max>
    : Repeating extends `${infer Min extends number},`
    ? RegexRepeatingToken<never, Min, -1>
    : Repeating extends `${infer Min extends number}`
    ? RegexRepeatingToken<never, Min, Min>
    : never

/**
 * Parse the next segment of the range
 */
type ParseRange<Range extends string> =
  Range extends `${infer First}${infer Second}${infer Third}${infer Rest}`
    ? Second extends "-"
      ? VerifyRange<First, Third> | ParseRange<Rest>
      : First | ParseRange<`${Second}${Third}${Rest}`>
    : Range extends `${infer First}${infer Second}${infer _}`
    ? First | Second
    : Range extends `${infer First}${infer _}`
    ? First
    : never

/**
 * Verify the range is valid and fits our hard coded sets
 */
type VerifyRange<
  Start extends string,
  End extends string
> = CToN<Start> extends number
  ? CToN<End> extends number
    ? BuildRange<CToN<Start>, CToN<End>> extends infer R extends string
      ? R
      : never
    : Start | "-" | End
  : Start | "-" | End

/**
 * Build all the characters in a range
 */
type BuildRange<
  N extends number,
  End extends number,
  D extends number = 0
> = NToC<N> extends string
  ? N extends End
    ? NToC<N>
    : NToC<N> | BuildRange<Increment<N>, End, Increment<D>>
  : never

/**
 * Valid token types
 */
type RegexToken =
  | RegexLiteralToken
  | RegexRangeToken
  | RegexRepeatingToken
  | RegexAlternateToken
  | RegexGroupToken

/**
 * A group token
 */
type RegexGroupToken<Group extends RegexToken[] = IgnoreAny> = {
  type: "group"
  group: Group
}

/**
 * An alternate token: a|b
 */
type RegexAlternateToken<
  Left extends RegexToken = IgnoreAny,
  Right extends RegexToken = IgnoreAny
> = {
  type: "alternate"
  left: Left
  right: Right
}

/**
 * Represents a literal token: A
 */
type RegexLiteralToken<Literal extends string = string> = {
  type: "literal"
  literal: Literal
}

/**
 * Represents a range of characters: [a-Z]
 */
type RegexRangeToken<Range extends string = string> = {
  type: "range"
  range: Range
}

/**
 * Represents a repeating token
 */
type RegexRepeatingToken<
  Token extends RegexToken = IgnoreAny,
  Minimum extends number = number,
  Maximum extends number = number
> = {
  type: "repeating"
  token: Token
  min: Minimum
  max: Maximum
}

/**
 * A potential branch towards a solution
 */
type RegexValidationState<
  Candidate extends string = string,
  Current extends RegexToken = IgnoreAny,
  Remaining extends RegexToken[] = IgnoreAny,
  Depth extends number = number
> = {
  candidate: Candidate
  current: Current
  remaining: Remaining
  depth: Depth
}

/**
 * Run a literal token against the candidate
 */
type RunLiteral<
  Candidate extends string,
  Token extends RegexToken
> = Token extends RegexLiteralToken<infer Literal>
  ? Candidate extends `${infer _ extends Literal}${infer Remainder}`
    ? Remainder
    : Candidate
  : Candidate

/**
 * Run a range token against the candidate
 */
type RunRange<
  Candidate extends string,
  Token extends RegexToken
> = Token extends RegexRangeToken<infer Range>
  ? Candidate extends `${infer _ extends Range}${infer Remainder}`
    ? Remainder
    : Candidate
  : Candidate

/**
 * Run a DFS exploration on a candidate token
 */
type RunStateMachine<
  Candidate extends string,
  Token extends RegexToken
> = GenerateStates<
  Candidate,
  Token
> extends infer States extends RegexValidationState[]
  ? TryAllStates<States>
  : never

/**
 * Run the DFS operation across all available states
 */
type TryAllStates<States> = States extends [
  infer Next extends RegexValidationState,
  ...infer Rest
]
  ? RunState<Next> extends "" // Verify we consumed the entire string
    ? true
    : Rest extends never[]
    ? false
    : TryAllStates<Rest> // Check the next potential state
  : never

/**
 * Check the current state for a valid result
 */
type RunState<State extends RegexValidationState> =
  State extends RegexValidationState<string, infer Token, IgnoreAny, number>
    ? Token extends RegexLiteralToken
      ? DFSLiteral<State> extends infer Result
        ? VerifyResult<Result>
        : false
      : Token extends RegexRangeToken
      ? DFSRange<State> extends infer Result
        ? VerifyResult<Result>
        : false
      : Token extends RegexRepeatingToken
      ? DFSRepeating2<State> extends infer Result
        ? VerifyResult<Result>
        : false
      : Token extends RegexAlternateToken
      ? DFSAlternate<State> extends infer Result
        ? VerifyResult<Result>
        : false
      : Token extends RegexGroupToken
      ? DFSGroup<State> extends infer Result
        ? VerifyResult<Result>
        : false
      : false
    : false

/**
 * Verify or call further down the state result chain
 */
type VerifyResult<Result> = Result extends RegexValidationState
  ? RunState<Result> extends infer R
    ? R
    : false
  : Result

/**
 * DFS on a range node
 */
type DFSRange<State extends RegexValidationState> =
  State extends RegexValidationState<
    infer Candidate,
    infer Token,
    infer Rest,
    infer _
  >
    ? Token extends RegexRangeToken
      ? RunRange<Candidate, Token> extends infer Returning extends string
        ? Returning extends Candidate
          ? false
          : NextState<Returning, Rest>
        : false
      : false
    : false

/**
 * Handle DFS call chain for a literal
 */
type DFSLiteral<State extends RegexValidationState> =
  State extends RegexValidationState<
    infer Candidate,
    infer Token,
    infer Rest,
    infer _
  >
    ? Token extends RegexLiteralToken
      ? RunLiteral<Candidate, Token> extends infer Returning extends string
        ? Returning extends Candidate
          ? false
          : NextState<Returning, Rest>
        : false
      : false
    : false

/**
 * Handle the DFS call chain for a repeating token using backtracking for
 * matches in range
 */
type DFSRepeating2<State extends RegexValidationState> =
  State extends RegexValidationState<
    infer Candidate,
    infer Token,
    infer Rest,
    infer N
  >
    ? Token extends RegexRepeatingToken<infer Repeating, infer Min, infer Max>
      ? RunState<
          RegexValidationState<Candidate, Repeating, [], 0>
        > extends infer Returning extends string
        ? InRange<Increment<N>, Min, Max> extends true
          ? NextState<
              Candidate,
              Rest
            > extends infer Next extends RegexValidationState
            ? RunState<Next> extends ""
              ? Next
              : RegexValidationState<Returning, Token, Rest, Increment<N>>
            : RegexValidationState<Returning, Token, Rest, Increment<N>> // No more states
          : RegexValidationState<Returning, Token, Rest, Increment<N>> // Keep recursive
        : InRange<N, Min, Max> extends true // Can we keep going ?
        ? NextState<Candidate, Rest>
        : false // No more repetition
      : false // Not repeating
    : false

/**
 * Run the DFS on the alternates
 */
type DFSAlternate<State extends RegexValidationState> =
  State extends RegexValidationState<
    infer Candidate,
    infer Token,
    infer Rest,
    infer N
  >
    ? Token extends RegexAlternateToken<infer Left, infer Right>
      ? RunState<
          RegexValidationState<Candidate, Left, Rest, N>
        > extends infer Result extends string
        ? Result
        : RunState<RegexValidationState<Candidate, Right, Rest, N>>
      : false
    : false

/**
 * Run the DFS over the group
 */
type DFSGroup<State extends RegexValidationState> =
  State extends RegexValidationState<
    infer Candidate,
    infer Token,
    infer Rest,
    infer _
  >
    ? Token extends RegexGroupToken<infer Group>
      ? Group extends [
          infer First extends RegexToken,
          ...infer Tokens extends RegexToken[]
        ]
        ? RunState<
            RegexValidationState<Candidate, First, Tokens, 0>
          > extends infer Result extends string
          ? NextState<Result, Rest>
          : false
        : false
      : false
    : false

/**
 * Generate the valid states from a given token
 */
type GenerateStates<
  Candidate extends string,
  Token extends RegexToken,
  N extends number = 0,
  Remaining extends RegexToken[] = []
> = Token extends RegexAlternateToken<infer Left, infer Right>
  ? [
      RegexValidationState<Candidate, Left, Remaining, N>,
      RegexValidationState<Candidate, Right, Remaining, N>
    ]
  : Token extends RegexGroupToken<infer Group>
  ? Group extends [infer SingleToken extends RegexToken]
    ? [RegexValidationState<Candidate, SingleToken, Remaining, N>]
    : Group extends [
        infer Next extends RegexToken,
        ...infer Rest extends RegexToken[]
      ]
    ? [RegexValidationState<Candidate, Next, [...Rest, ...Remaining], N>]
    : never
  : [RegexValidationState<Candidate, Token, Remaining, N>]

/**
 * Get the next available state
 */
type NextState<
  Candidate extends string,
  Tokens extends RegexToken[],
  Counter extends number = 0
> = Tokens extends [infer SingleToken extends RegexToken]
  ? RegexValidationState<Candidate, SingleToken, [], Counter>
  : Tokens extends [
      infer NextToken extends RegexToken,
      ...infer Rest extends RegexToken[]
    ]
  ? RegexValidationState<Candidate, NextToken, Rest, Counter>
  : Candidate

/**
 * Get the value for the character
 */
type CToN<C extends string> = C extends keyof CharToIdx ? CharToIdx[C] : never

/**
 * Get the character for the value
 */
type NToC<N extends number> = IdxToChar[N] extends [never]
  ? never
  : IdxToChar[N]

/**
 * Array index to character
 */
type IdxToChar = [
  "\t",
  "\n",
  "\r",
  " ",
  "!",
  '"',
  "#",
  "$",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "[",
  "\\",
  "]",
  "^",
  "_",
  "`",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "{",
  "|",
  "}",
  "~"
]

/**
 * Character to index mapping
 */
type CharToIdx = {
  "\t": 0
  "\n": 1
  "\r": 2
  " ": 3
  "!": 4
  '"': 5
  "#": 6
  $: 7
  "%": 8
  "&": 9
  "'": 10
  "(": 11
  ")": 12
  "*": 13
  "+": 14
  ",": 15
  "-": 16
  ".": 17
  "/": 18
  "0": 19
  "1": 20
  "2": 21
  "3": 22
  "4": 23
  "5": 24
  "6": 25
  "7": 26
  "8": 27
  "9": 28
  ":": 29
  ";": 30
  "<": 31
  "=": 32
  ">": 33
  "?": 34
  "@": 35
  A: 36
  B: 37
  C: 38
  D: 39
  E: 40
  F: 41
  G: 42
  H: 43
  I: 44
  J: 45
  K: 46
  L: 47
  M: 48
  N: 49
  O: 50
  P: 51
  Q: 52
  R: 53
  S: 54
  T: 55
  U: 56
  V: 57
  W: 58
  X: 59
  Y: 60
  Z: 61
  "[": 62
  "\\": 63
  "]": 64
  "^": 65
  _: 66
  "`": 67
  a: 68
  b: 69
  c: 70
  d: 71
  e: 72
  f: 73
  g: 74
  h: 75
  i: 76
  j: 77
  k: 78
  l: 79
  m: 80
  n: 81
  o: 82
  p: 83
  q: 84
  r: 85
  s: 86
  t: 87
  u: 88
  v: 89
  w: 90
  x: 91
  y: 92
  z: 93
  "{": 94
  "|": 95
  "}": 96
  "~": 97
}
