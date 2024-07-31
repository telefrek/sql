/**
 * Check if a number is negative
 */
export type IsNegative<N extends number> = `${N}` extends `-${number}`
  ? true
  : false

/**
 * Get the absolute value of a number
 */
export type Abs<N extends number> =
  `${N}` extends `-${infer abs extends number}` ? abs : N

/**
 * Increment a number
 */
export type Increment<N extends number> =
  Add<N, 1> extends infer I extends number ? I : never

/**
 * Decrement a number
 */
export type Decrement<N extends number> =
  Subtract<N, 1> extends infer D extends number ? D : never

/**
 * Check if L > R
 */
export type GT<L extends number, R extends number> = [L] extends [R]
  ? false
  : IsNegative<L> extends IsNegative<R>
    ? IsNegative<L> extends true
      ? SplitDecimal<`${Abs<L>}`, `${Abs<R>}`> extends true // if both negative, reverse GT
        ? false
        : true
      : SplitDecimal<`${L}`, `${R}`>
    : IsNegative<L> extends true
      ? false
      : true

/**
 * Check if L >= R
 */
export type GTE<L extends number, R extends number> = [L] extends [R]
  ? true
  : IsNegative<L> extends IsNegative<R>
    ? IsNegative<L> extends true
      ? SplitDecimal<`${Abs<L>}`, `${Abs<R>}`, true> extends true // if both negative, reverse GTE
        ? false
        : true
      : SplitDecimal<`${L}`, `${R}`, true>
    : IsNegative<L> extends true
      ? false
      : true

/**
 * Check if L <= R
 */
export type LTE<L extends number, R extends number> =
  GT<L, R> extends true ? false : true

/**
 * Check if L < R
 */
export type LT<L extends number, R extends number> =
  GTE<L, R> extends true ? false : true

/**
 * Perform "subtraction" of the two numbers
 */
export type Subtract<L extends number, R extends number> =
  IsNegative<L> extends IsNegative<R>
    ? IsNegative<L> extends true
      ? Subtract<R, Abs<L>> // -l - (-r) = r - l
      : _Subtract<`${L}`, `${R}`> extends infer N extends number
        ? N
        : never // l - r
    : IsNegative<L> extends true
      ? Add<Abs<L>, R> extends infer N extends number
        ? _Negate<N> // -l - (r) = - (l + r)
        : never
      : Add<L, Abs<R>> // l - (- r)  = l + r

/**
 * Perform "addition" of the two numbers
 */
export type Add<L extends number, R extends number> = L extends 0
  ? R
  : IsNegative<L> extends IsNegative<R>
    ? IsNegative<L> extends true
      ? Add<Abs<L>, Abs<R>> extends infer N extends number
        ? _Negate<N>
        : never // -l + -r = - (l + r)
      : _Add<`${L}`, `${R}`> extends infer N extends number
        ? N
        : never // l + r
    : IsNegative<L> extends true
      ? Subtract<R, Abs<L>> // -l + r = r - l
      : Subtract<L, Abs<R>> // l + (-r) = l - r

// 77 + 4 = 4 + 7 (11) => 1 carry, 7 + carry = 8 = 81

////////////////////////////////
// Utility Methods
////////////////////////////////

/**
 * Set of single digits that are valid
 */
type SingleDigits = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

/**
 * Negate the positive value and make it a negative
 */
type _Negate<N extends number> = `-${N}` extends `${infer Neg extends number}`
  ? Neg
  : never

/**
 * Digits for adding remainders
 */
type Add_Digits_Arr = [
  ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["2", "3", "4", "5", "6", "7", "8", "9", "0", "1"],
  ["3", "4", "5", "6", "7", "8", "9", "0", "1", "2"],
  ["4", "5", "6", "7", "8", "9", "0", "1", "2", "3"],
  ["5", "6", "7", "8", "9", "0", "1", "2", "3", "4"],
  ["6", "7", "8", "9", "0", "1", "2", "3", "4", "5"],
  ["7", "8", "9", "0", "1", "2", "3", "4", "5", "6"],
  ["8", "9", "0", "1", "2", "3", "4", "5", "6", "7"],
  ["9", "0", "1", "2", "3", "4", "5", "6", "7", "8"],
]

/**
 * Digits for subtraction remainders
 */
type Sub_Digits_Arr = [
  ["0", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
  ["1", "0", "9", "8", "7", "6", "5", "4", "3", "2"],
  ["2", "1", "0", "9", "8", "7", "6", "5", "4", "3"],
  ["3", "2", "1", "0", "9", "8", "7", "6", "5", "4"],
  ["4", "3", "2", "1", "0", "9", "8", "7", "6", "5"],
  ["5", "4", "3", "2", "1", "0", "9", "8", "7", "6"],
  ["6", "5", "4", "3", "2", "1", "0", "9", "8", "7"],
  ["7", "6", "5", "4", "3", "2", "1", "0", "9", "8"],
  ["8", "7", "6", "5", "4", "3", "2", "1", "0", "9"],
  ["9", "8", "7", "6", "5", "4", "3", "2", "1", "0"],
]

/**
 * Digits where there is a carry operation
 */
type Add_CarryDigits = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

/**
 * Digits where we need to borrow
 */
type Sub_Borrow_Digits = [
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]

/**
 * Compare the length of two strings to find out which one is larger
 */
type CheckLength<L extends string, R extends string> = L extends ""
  ? R extends ""
    ? 0
    : -1
  : R extends ""
    ? 1
    : L extends `${SingleDigits}${infer LR extends string}`
      ? R extends `${SingleDigits}${infer RR extends string}`
        ? CheckLength<LR, RR>
        : 1
      : 0

/**
 * Wrapper to check for decimal places and split into LHS, RHS comparisons
 */
type SplitDecimal<
  L extends string,
  R extends string,
  GTE extends boolean = false,
> = L extends `${infer LN extends string}.${infer LD extends string}`
  ? R extends `${infer RN extends string}.${infer RD extends string}`
    ? CheckLHS<LN, RN, true> extends true // both decimals check LHS then RHS
      ? LD extends RD
        ? GTE
        : CheckRHS<LD, RD, GTE>
      : "false"
    : LN extends R // IF LHS === R, then decimal makes it bigger
      ? true
      : CheckLHS<LN, R, GTE> // IF LHS is gt then it's bigger
  : CheckLHS<L, R, GTE> // Just compare left hand side

/**
 * Compare the LHS checking size first
 */
type CheckLHS<L extends string, R extends string, GTE extends boolean = false> =
  CheckLength<L, R> extends infer V extends number
    ? V extends 1
      ? true
      : V extends -1
        ? false
        : L extends `${infer LS extends SingleDigits}`
          ? R extends `${infer RS extends SingleDigits}`
            ? GTE extends true
              ? _GTE<LS, RS>
              : _GT<LS, RS>
            : never
          : L extends `${infer LS extends SingleDigits}${infer LR extends string}`
            ? R extends `${infer RS extends SingleDigits}${infer RR extends string}`
              ? _GTE<LS, RS> extends true
                ? CheckLHS<LR, RR, GTE>
                : false
              : never
            : never
    : never

/**
 * Just keep checking the next values until one runs out or the left is smaller
 * than the right
 */
type CheckRHS<
  L extends string,
  R extends string,
  GTE extends boolean = false,
> = L extends ""
  ? false
  : R extends ""
    ? true
    : L extends `${infer LS extends SingleDigits}${infer LR extends string}`
      ? R extends `${infer RS extends SingleDigits}${infer RR extends string}`
        ? _GTE<LS, RS> extends true
          ? LR extends RR
            ? LR extends ""
              ? true
              : GTE
            : CheckRHS<LR, RR>
          : false
        : never
      : never

/**
 * Single digit compare for L > R
 */
type _GT<L extends SingleDigits, R extends SingleDigits> = L extends "0"
  ? false
  : L extends "1"
    ? R extends "0"
      ? true
      : false
    : L extends "2"
      ? R extends "1" | "0"
        ? true
        : false
      : L extends "3"
        ? R extends "2" | "1" | "0"
          ? true
          : false
        : L extends "4"
          ? R extends "3" | "2" | "1" | "0"
            ? true
            : false
          : L extends "5"
            ? R extends "5" | "6" | "7" | "8" | "9"
              ? false
              : true
            : L extends "6"
              ? R extends "6" | "7" | "8" | "9"
                ? false
                : true
              : L extends "7"
                ? R extends "7" | "8" | "9"
                  ? false
                  : true
                : L extends "8"
                  ? R extends "8" | "9"
                    ? false
                    : true
                  : R extends "9"
                    ? false
                    : true

/**
 * Single digit compare for L >= R
 */
type _GTE<L extends SingleDigits, R extends SingleDigits> = L extends "0"
  ? true
  : L extends "1"
    ? R extends "0" | "1"
      ? true
      : false
    : L extends "2"
      ? R extends "0" | "1" | "2"
        ? true
        : false
      : L extends "3"
        ? R extends "0" | "1" | "2" | "3"
          ? true
          : false
        : L extends "4"
          ? R extends "0" | "1" | "2" | "3" | "4"
            ? true
            : false
          : L extends "5"
            ? R extends "6" | "7" | "8" | "9"
              ? false
              : true
            : L extends "6"
              ? R extends "7" | "8" | "9"
                ? false
                : true
              : L extends "7"
                ? R extends "8" | "9"
                  ? false
                  : true
                : L extends "8"
                  ? R extends "9"
                    ? false
                    : true
                  : true

/**
 * Convert a string representation to the corresponding numeric value
 */
type StringAsNumber<S extends string> =
  TrimZero<S> extends `${infer N extends number}` ? N : never

/**
 * Utility to remove leading zeros from numbers
 */
type TrimZero<N extends string> = N extends `0${infer _}` ? TrimZero<_> : N

/**
 * Wrapper to ensure we call long form with the longest string on the left
 *
 * NOTE: This DOES NOT handle decimals yet
 */
type _Add<L extends string, R extends string> =
  CheckLength<L, R> extends -1
    ? LongFormAddition<R, L> extends infer Res extends string
      ? StringAsNumber<Res>
      : never
    : LongFormAddition<L, R> extends infer Res extends string
      ? StringAsNumber<Res>
      : never

/**
 * Wrapper to ensure we call long form with the "largest" value on the left
 *
 * NOTE: This DOES NOT handle decimals yet
 */
type _Subtract<L extends string, R extends string> = L extends R
  ? 0
  : CheckLHS<L, R> extends false
    ? LongFormSubtraction<R, L> extends infer Res extends string
      ? _Negate<StringAsNumber<Res>>
      : never
    : LongFormSubtraction<L, R> extends infer Res extends string
      ? StringAsNumber<Res>
      : never

/**
 * Perform long form subtraction with the left being the larger number
 */
type LongFormSubtraction<
  L extends string,
  R extends string,
  B extends boolean = false,
> = L extends ""
  ? ""
  : R extends ""
    ? B extends true
      ? SplitRightDigit<L> extends [
          infer LD extends SingleDigits,
          infer LS extends string,
        ]
        ? LS extends ""
          ? SubtractDigit<LD, "1">
          : `${LS}${SubtractDigit<LD, "1">}`
        : never
      : L
    : LFSNextState<L, R, B> extends [
          infer ND extends SingleDigits,
          infer LS extends string,
          infer RS extends string,
          infer Chk extends boolean,
        ]
      ? LongFormSubtraction<LS, RS, Chk> extends infer Arr extends string
        ? `${Arr}${ND}`
        : never
      : never

/**
 * Perform addition one digit at a time, carrying results
 */
type LongFormAddition<
  L extends string,
  R extends string,
  C extends boolean = false,
> = L extends ""
  ? C extends true
    ? "1"
    : ""
  : R extends ""
    ? C extends true
      ? SplitRightDigit<L> extends [
          infer LD extends SingleDigits,
          infer LS extends string,
        ]
        ? GetCarry<LD, "1"> extends true
          ? LS extends ""
            ? `1${AddDigit<LD, "1">}`
            : AddDigit<LD, "1">
          : AddDigit<LD, "1">
        : never
      : L
    : LFANextState<L, R, C> extends [
          infer ND extends SingleDigits,
          infer LS extends string,
          infer RS extends string,
          infer Chk extends boolean,
        ]
      ? LongFormAddition<LS, RS, Chk> extends infer Arr extends string
        ? `${Arr}${ND}`
        : never
      : never

/**
 * Get the next state for the LongFormAddition
 */
type LFANextState<L extends string, R extends string, C extends boolean> =
  SplitRightDigit<L> extends [
    infer LD extends SingleDigits,
    infer LS extends string,
  ]
    ? SplitRightDigit<R> extends [
        infer RD extends SingleDigits,
        infer RS extends string,
      ]
      ? C extends true
        ? [AddDigitWithCarry<LD, RD, "1">, LS, RS, Carry<LD, RD, "1">]
        : [AddDigitWithCarry<LD, RD, "0">, LS, RS, Carry<LD, RD, "0">]
      : never
    : never

/**
 * Calculate the next state for LongFormSubtraction
 */
type LFSNextState<L extends string, R extends string, B extends boolean> =
  SplitRightDigit<L> extends [
    infer LD extends SingleDigits,
    infer LS extends string,
  ]
    ? SplitRightDigit<R> extends [
        infer RD extends SingleDigits,
        infer RS extends string,
      ]
      ? B extends true
        ? [SubtractDigitWithBorrow<LD, RD, "1">, LS, RS, Borrow<LD, RD, "1">]
        : [SubtractDigitWithBorrow<LD, RD, "0">, LS, RS, Borrow<LD, RD, "0">]
      : never
    : never

/**
 * Extract the right digit for adding
 */
type SplitRightDigit<N extends string> =
  N extends `${infer K extends string}${SingleDigits}`
    ? N extends `${K}${infer D extends string}`
      ? D extends infer SD extends SingleDigits
        ? [SD, K]
        : never
      : never
    : N extends `${infer SD extends SingleDigits}`
      ? [SD, ""]
      : never

/**
 * Subtract a digit
 */
type SubtractDigit<
  L extends SingleDigits,
  R extends SingleDigits,
> = L extends keyof Sub_Digits_Arr
  ? R extends keyof Sub_Digits_Arr[L]
    ? Sub_Digits_Arr[L][R]
    : never
  : never

/**
 * Subtract a digit with borrowing
 */
type SubtractDigitWithBorrow<
  L extends SingleDigits,
  R extends SingleDigits,
  B extends "0" | "1",
> = B extends "1"
  ? SubtractDigit<L, "1"> extends infer D extends SingleDigits
    ? SubtractDigit<D, R>
    : never
  : SubtractDigit<L, R>

/**
 * Check if borrowing required
 */
type Borrow<
  L extends SingleDigits,
  R extends SingleDigits,
  B extends "0" | "1",
> = B extends "1" ? GetBorrow<SubtractDigit<L, "1">, R> : GetBorrow<L, R>

/**
 * Get the borrow flag
 */
type GetBorrow<
  L extends SingleDigits,
  R extends SingleDigits,
> = L extends keyof Sub_Borrow_Digits
  ? R extends keyof Sub_Borrow_Digits[L]
    ? Sub_Borrow_Digits[L][R] extends 1
      ? true
      : false
    : "1"
  : "2"

/**
 * Calculate the next digit, taking into account any carrying
 */
type AddDigitWithCarry<
  L extends SingleDigits,
  R extends SingleDigits,
  C extends "0" | "1",
> =
  AddDigit<L, R> extends infer D extends SingleDigits
    ? C extends "1"
      ? AddDigit<D, "1"> extends infer D1 extends SingleDigits
        ? D1
        : never
      : D
    : never

/**
 * Check if carry is required taking into account current digits and previous carry
 */
type Carry<
  L extends SingleDigits,
  R extends SingleDigits,
  C extends "0" | "1",
> =
  GetCarry<L, R> extends true
    ? true
    : C extends "1"
      ? GetCarry<AddDigit<L, R>, "1">
      : false

/**
 * Get the digit at the location of the two single digit values
 */
type AddDigit<
  L extends SingleDigits,
  R extends SingleDigits,
> = L extends keyof Add_Digits_Arr
  ? R extends keyof Add_Digits_Arr[L]
    ? Add_Digits_Arr[L][R]
    : never
  : never

/**
 * Get the carry state at the location of the two single digit values
 */
type GetCarry<
  L extends SingleDigits,
  R extends SingleDigits,
> = L extends keyof Add_CarryDigits
  ? R extends keyof Add_CarryDigits[L]
    ? Add_CarryDigits[L][R] extends 1
      ? true
      : false
    : never
  : never
