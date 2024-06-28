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
 * Type for passing invalid typings since there is no way to do it currently
 *
 * @template S The value to carry through for messaging
 */
export type Invalid<S> = S | void | never

/**
 * Type to ensure spread operators have at least one element
 */
export type AtLeastOne<T> = [T, ...T[]]
