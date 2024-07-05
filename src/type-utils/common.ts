/**
 * Utility type to track all places where are are intentionally using any to
 * break things
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IgnoreAny = any

/**
 * Utility type to carry some invalid type information
 */
export type Invalid<Error> = Error | void | never

/**
 * Utility type to define an object or array
 */
export type OneOrMore<T> = T | AtLeastOne<T>

/**
 * Type to ensure spread operators have at least one element
 */
export type AtLeastOne<T> = [T, ...T[]]
