import type { Flatten, Invalid } from "./common.js"

/**
 * Get all the keys of type T
 */
export type Keys<T> = {
  [K in keyof T]: K
}[keyof T]

/**
 * Get all of the keys that are strings
 */
export type StringKeys<T> = Extract<Keys<T>, string>

/**
 * Creates a type that has the required subset properties of T
 *
 * @template T The superset type
 * @template K The keys from the subset
 */
export type RequiredSubset<T, K extends keyof T> = Flatten<{
  [k in K]-?: Required<T>[k]
}>

/**
 * All of the literal required keys from a type
 */
export type RequiredLiteralKeys<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : object extends Pick<T, K>
    ? never
    : K]: T[K]
}

/**
 * All of the optional (explicit) keys
 */
export type OptionalLiteralKeys<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : object extends Pick<T, K>
    ? K
    : never]: T[K]
}

/**
 * Type guard to prevent duplicate keys
 *
 * @template K The candidate key
 * @template T The existing type
 */
export type CheckDuplicateKey<K extends string, T> = [K] extends [StringKeys<T>]
  ? Invalid<"Duplicate keys are not allowed">
  : K
