import type { Invalid } from "@telefrek/type-utils/common"
import type { Decrement, Increment } from "@telefrek/type-utils/math"
import type { Trim } from "@telefrek/type-utils/strings"
import type { ColumnReference } from "../../ast/columns.js"
import type {
  BooleanValueType,
  BufferValueType,
  NullValueType,
  NumberValueType,
  ParameterValueType,
  StringValueType,
  ValueTypes,
} from "../../ast/values.js"
import { parseColumnReference, type ParseColumnReference } from "./columns.js"
import type { NextToken } from "./normalize.js"
import type { GetQuote, ParserOptions } from "./options.js"

export function parseValue(
  value: string,
  quote: string = `'`
): ValueTypes | ColumnReference {
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
  } else if (value.startsWith(quote) && value.endsWith(quote)) {
    return {
      type: "StringValue",
      value: value.slice(1, -1),
    }
  } else {
    return parseColumnReference(value.split(" "))
  }
}

/**
 * Regex to test for valid numbers
 */
const NUMERIC_REGEX = /NaN|-?((\d*\.\d+|\d+)([Ee][+-]?\d+)?|Infinity)/

/**
 * Regex to test for simple integers that are positive/negative
 */
const INT_REGEX = /-?[0-9]+/

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
 * Extract values types from an array of strings
 */
export type ExtractValues<
  Values,
  Options extends ParserOptions
> = Values extends [infer Value extends string, ...infer Rest]
  ? ExtractValueType<Value, Options> extends infer V extends ValueTypes
    ? Rest extends never[]
      ? [V]
      : ExtractValues<Rest, Options> extends infer V1 extends ValueTypes[]
      ? [V, ...V1]
      : ExtractValues<Rest, Options>
    : ExtractValueType<Value, Options>
  : never

type ExtractValueType<
  T extends string,
  Options extends ParserOptions
> = ExtractValue<T, Options> extends [infer V extends string]
  ? GetQuote<Options> extends infer Quote extends string
    ? CheckValueType<V, Quote>
    : never
  : Invalid<`Failed to extract value type`>

/**
 * Parse out the entire value string (may be quoted)
 */
export type ExtractValue<
  T extends string,
  Options extends ParserOptions,
  N extends number = 0,
  S extends string = ""
> = NextToken<T> extends [infer Left extends string, infer Right extends string]
  ? Right extends ""
    ? [Trim<`${S} ${Left & string}`>]
    : Left extends `${Options["quote"]}${infer _}'`
    ? ExtractValue<Right, Options, N, `${S} ${Left}`>
    : Left extends `'${infer Rest}`
    ? N extends 0
      ? ExtractValue<Right, Options, Increment<N>, `${S} '${Rest & string}`>
      : ExtractValue<Right, Options, Increment<N>, `${S} ${Left & string}`>
    : Left extends `${infer _}${Options["quote"]}`
    ? ExtractValue<Right, Options, N, `${S} ${Left & string}`>
    : Left extends `${infer Rest}'`
    ? N extends 1
      ? [Trim<`${S} ${Rest & string}`>, Right]
      : ExtractValue<Right, Options, Decrement<N>, `${S} ${Left & string}`>
    : S extends ""
    ? [Left, Right]
    : ExtractValue<Right, Options, N, `${S} ${Left & string}`>
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
  : T extends `${Quote}${infer _}${Quote}`
  ? StringValueType
  : T extends `0x${infer _}`
  ? BufferValueType<Uint8Array>
  : Lowercase<T & string> extends "null"
  ? NullValueType
  : Lowercase<T & string> extends "true"
  ? BooleanValueType
  : Lowercase<T & string> extends "false"
  ? BooleanValueType
  : T extends `${infer First}${infer _}`
  ? [First] extends [Digits]
    ? NumberValueType
    : ParseColumnReference<T & string>
  : ParseColumnReference<T & string>
