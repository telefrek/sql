/**
 * Utility type to carry some invalid type information
 */
export type Invalid<Error> = Error | void | never

/**
 * Utility type to define an object or array
 */
export type OneOrMore<T> = T | T[]
