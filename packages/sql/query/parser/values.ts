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
  } else if (!isNaN(Number(value))) {
    return {
      type: "NumberValue",
      value: Number.parseFloat(value),
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
    return parseColumnReference(value)
  }
}

/**
 * Parse out the entire value string (may be quoted)
 */
export type ExtractValue<
  T extends string,
  N extends number = 0,
  S extends string = ""
> = NextToken<T> extends [infer Left extends string, infer Right extends string]
  ? Right extends ""
    ? [Trim<`${S} ${Left & string}`>]
    : Left extends `'${infer _}'`
    ? ExtractValue<Right, N, `${S} ${Left}`>
    : Left extends `'${infer Rest}`
    ? N extends 0
      ? ExtractValue<Right, Increment<N>, `${S} '${Rest & string}`>
      : ExtractValue<Right, Increment<N>, `${S} ${Left & string}`>
    : Left extends `${infer _}\\'`
    ? ExtractValue<Right, N, `${S} ${Left & string}`>
    : Left extends `${infer Rest}'`
    ? N extends 1
      ? [Trim<`${S} ${Rest & string}`>, Right]
      : ExtractValue<Right, Decrement<N>, `${S} ${Left & string}`>
    : S extends ""
    ? [Left, Right]
    : ExtractValue<Right, N, `${S} ${Left & string}`>
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
export type CheckValueType<
  T,
  Quote extends string = `'`
> = T extends `:${infer Name}`
  ? ParameterValueType<Name>
  : T extends `$${infer _}`
  ? Invalid<`index position not supported`>
  : T extends `${Quote}${string}${Quote}`
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
