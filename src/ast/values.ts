/**
 * The set of value types supported
 */
export type ValueTypes =
  | BooleanValueType
  | NumberValueType
  | BigIntValueType
  | BufferValueType
  | StringValueType
  | JsonValueType
  | ArrayValueType
  | NullValueType
  | ParameterValueType

/**
 * A parameter that is passed into the query at runtime
 */
export type ParameterValueType<Name extends string = string> = {
  type: "ParameterValue"
  value: Name
}

/**
 * A {@link boolean} value
 */
export type BooleanValueType = {
  type: "BooleanValue"
  value: boolean
}

/**
 * A {@link number} value
 */
export type NumberValueType = {
  type: "NumberValue"
  value: number
}

/**
 * A {@link bigint} value
 */
export type BigIntValueType<B extends number | bigint = bigint> = {
  type: "BigIntValue"
  value: B
}

/**
 * A {@link Uint8Array} value
 */
export type BufferValueType<B extends Uint8Array = Uint8Array> = {
  type: "BufferValue"
  value: B
}

/**
 * A {@link string} value
 */
export type StringValueType = {
  type: "StringValue"
  value: string
}

/**
 * An explicit `null` reference
 */
export type NullValueType = {
  type: "NullValue"
  value: null
}

/**
 * A JSON value
 */
export type JsonValueType<J extends object = object> = {
  type: "JsonValue"
  value: J
}

/**
 * An array value
 */
export type ArrayValueType<A extends unknown[] = unknown[]> = {
  type: "ArrayValue"
  value: A
}
