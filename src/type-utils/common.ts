/**
 * Simple type that returns itself
 *
 * @template T The type to return
 */
type Identity<T> = T

/**
 * Collapse the type definition into a single type
 *
 * @template T The complex type to flatten
 */
export type Flatten<T> = Identity<{ [K in keyof T]: T[K] }>

/**
 * Utility type to carry some invalid type information
 */
export type Invalid<Error> = Error | void | never

/**
 * Utility type to define an object or array
 */
export type OneOrMore<T> = T | T[]

/**
 * Type to ensure spread operators have at least one element
 */
export type AtLeastOne<T> = [T, ...T[]]
