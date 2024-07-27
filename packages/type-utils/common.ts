/**
 * Simple type that returns itself
 */
type Identity<T> = T

/**
 * Collapse the type definition into a single type
 *
 * @template T The complex type to flatten
 */
export type Flatten<T> = Identity<{ [K in keyof T]: T[K] }>

export type AddKVToType<T, K extends string | number, V> = Flatten<
  T & { [key in K]: V }
>

/**
 * Utility type to track all places where are are intentionally using any to
 * break things
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IgnoreAny = any

/**
 * Utility type to track all places where are are intentionally using an empty definition
 */

export type IgnoreEmpty = NonNullable<unknown>

/**
 * Utility type to carry some invalid type information
 */
export type Invalid<Error> = Error | void | never

/**
 * Utility type to define an object or array
 */
export type OneOrMore<T> = T | AtLeastOne<T[]>

/**
 * Type to ensure spread operators have at least one element
 */
export type AtLeastOne<T> = T extends never[] ? never : T
