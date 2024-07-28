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
export type BigIntValueType = {
  type: "BigIntValue"
  value: bigint
}

/**
 * A {@link Uint8Array} value
 */
export type BufferValueType = {
  type: "BufferValue"
  value: Uint8Array
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
export type JsonValueType = {
  type: "JsonValue"
  value: object
}

/**
 * An array value
 */
export type ArrayValueType = {
  type: "ArrayValue"
  value: unknown[]
}
