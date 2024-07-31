import type { Invalid } from "@telefrek/type-utils/common"
import type { Decrement, Increment } from "@telefrek/type-utils/math"
import type { Trim } from "@telefrek/type-utils/strings"
import type {
  ArrayValueType,
  BigIntValueType,
  BooleanValueType,
  BufferValueType,
  JsonValueType,
  NullValueType,
  NumberValueType,
  ParameterValueType,
  StringValueType,
  ValueTypes,
} from "../../ast/values.js"
import type { NextToken, SplitSQL } from "./normalize.js"
import type { GetQuote, ParserOptions } from "./options.js"

/**
 * Parse out the value
 *
 * @param value The value to parse
 * @param quote The quoted character
 * @returns The next value or column reference identified
 */
export function parseValue(value: string, quote: string = "'"): ValueTypes {
  if (value.startsWith(":")) {
    return {
      type: "ParameterValue",
      value: value.substring(1),
    }
  } else if (value.startsWith("$")) {
    throw new Error("Index positions for variables is not supported")
  } else if (value === "true" || value === "false") {
    return {
      type: "BooleanValue",
      value: Boolean(value),
    }
  } else if (isNumber(value)) {
    return {
      type: "NumberValue",
      value: Number(value),
    }
  } else if (isBigInt(value)) {
    return {
      type: "BigIntValue",
      value: BigInt(value),
    }
  } else if (value === "null") {
    return {
      type: "NullValue",
      value: null,
    }
  } else if (value.startsWith("{")) {
    return {
      type: "JsonValue",
      value: JSON.parse(value),
    }
  } else if (value.startsWith("[")) {
    return {
      type: "ArrayValue",
      value: JSON.parse(value),
    }
  } else if (value.startsWith("0x")) {
    return {
      type: "BufferValue",
      value: Uint8Array.from(
        Uint8Array.from(
          value
            .slice(2)
            .match(/.{1,2}/g)!
            .map((byte) => parseInt(byte, 16))
        )
      ),
    }
  } else {
    return {
      type: "StringValue",
      value: value.replaceAll(quote, ""),
    }
  }
}

/**
 * Regex to test for valid numbers
 */
const NUMERIC_REGEX = /^NaN|-?((\d*\.\d+|\d+)([Ee][+-]?\d+)?|Infinity)$/

/**
 * Regex to test for simple integers that are positive/negative
 */
const INT_REGEX = /^-?[0-9]+$/

/**
 * Test for values that are less than MAX_SAFE_INTEGER for int
 * @param value The value to test
 * @returns True if it's a safe number
 */
function isNumber(value: string): boolean {
  return (
    !isNaN(Number(value)) &&
    (INT_REGEX.test(value) ? Number(value) < Number.MAX_SAFE_INTEGER : true)
  )
}

/**
 *
 * @param value Test if the value is a big integer
 * @returns
 */
function isBigInt(value: string): boolean {
  try {
    return NUMERIC_REGEX.test(value) && BigInt(value) !== null
  } catch {
    return true
  }
}

/**
 * Utility type to parse an array of values from a string
 *
 * ex: ParseValues<`true , false , 'hello world' , 1 ,  '{ key: "value"}'`>
 *
 * gives [BooleanValueType, BooleanValueType, StringValueType, NumberValueType, JsonValueType]
 */
export type ParseValues<
  ValuesSQL extends string,
  Options extends ParserOptions
> = ExtractValues<SplitSQL<ValuesSQL>, GetQuote<Options>>

/**
 * Match the Values passed through to their TypeScript types
 */
export type ExtractTSValueTypes<Values> = Values extends [
  infer NextValue extends ValueTypes,
  ...infer Rest
]
  ? Rest extends never[]
    ? [TSValueType<NextValue>]
    : [TSValueType<NextValue>, ...ExtractTSValueTypes<Rest>]
  : never

/**
 * Internal type mapping
 */
type TSValueType<Value extends ValueTypes> = Value extends BooleanValueType
  ? boolean
  : Value extends BigIntValueType
  ? bigint | number
  : Value extends StringValueType
  ? string
  : Value extends NumberValueType
  ? number
  : Value extends NullValueType
  ? null
  : Value extends JsonValueType
  ? object
  : Value extends ArrayValueType
  ? unknown[]
  : Value extends BufferValueType
  ? Uint8Array
  : never

/**
 * Extract values types from an array of strings
 */
export type ExtractValues<Values, Quote extends string> = Values extends [
  infer Value extends string,
  ...infer Rest
]
  ? ExtractValueType<Value, Quote> extends infer V extends ValueTypes
    ? Rest extends never[]
      ? [V]
      : ExtractValues<Rest, Quote> extends infer V1 extends ValueTypes[]
      ? [V, ...V1]
      : ExtractValues<Rest, Quote>
    : ExtractValueType<Value, Quote>
  : never

/**
 * Extract the value type of the string
 */
type ExtractValueType<T extends string, Quote extends string> = ExtractValue<
  T,
  Quote
> extends [infer V extends string]
  ? CheckValueType<V, Quote>
  : Invalid<`Failed to extract value type`>

// TODO: Need to support array values like ['apple', 'banana', 'pear']
/**
 * Parse out the entire value string (may be quoted)
 */
type ExtractValue<
  T extends string,
  Quote extends string,
  N extends number = 0,
  S extends string = ""
> = NextToken<T> extends [infer Left extends string, infer Right extends string]
  ? Right extends ""
    ? [Trim<`${S} ${Left & string}`>]
    : Left extends `${Quote}${infer _}`
    ? ExtractValue<Right, Quote, N, `${S} ${Left}`>
    : Left extends `'${infer Rest}`
    ? N extends 0
      ? ExtractValue<Right, Quote, Increment<N>, `${S} '${Rest & string}`>
      : ExtractValue<Right, Quote, Increment<N>, `${S} ${Left & string}`>
    : Left extends `${infer _}${Quote}`
    ? ExtractValue<Right, Quote, N, `${S} ${Left & string}`>
    : Left extends `${infer Rest}'`
    ? N extends 1
      ? [Trim<`${S} ${Rest & string}`>, Right]
      : ExtractValue<Right, Quote, Decrement<N>, `${S} ${Left & string}`>
    : S extends ""
    ? [Left, Right]
    : ExtractValue<Right, Quote, N, `${S} ${Left & string}`>
  : Invalid<`Failed to extract value from: ${T & string}`>

/**
 * Set of valid digits
 */
type Digits = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

/**
 * Check the type of value
 */
// TODO: Possible extension is to check that all characters for numbers are
// digits and expand to bigint if over 8 characters by default
export type CheckValueType<T, Quote extends string> = T extends `:${infer Name}`
  ? ParameterValueType<Name>
  : T extends `$${infer _}`
  ? Invalid<`index position not supported`>
  : T extends `${Quote}${infer Contents}${Quote}`
  ? Contents extends `{${string}}`
    ? JsonValueType
    : StringValueType
  : T extends `0x${infer _}`
  ? BufferValueType
  : Lowercase<T & string> extends "null"
  ? NullValueType
  : Lowercase<T & string> extends "true"
  ? BooleanValueType
  : Lowercase<T & string> extends "false"
  ? BooleanValueType
  : T extends `${infer First}${infer _}`
  ? [First] extends [Digits]
    ? NumberValueType
    : Invalid<"Not a valid value type">
  : Invalid<"Not a valid value type">
