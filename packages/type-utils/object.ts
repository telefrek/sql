import type { Flatten, Invalid } from "./common.js"

/**
 * Clone the object
 * @param original The original object to clone
 * @returns A clone of the object
 */
export function clone<T, U = T extends Array<infer V> ? V : never>(
  original: T,
): T {
  return original instanceof Date
    ? (new Date(original.getTime()) as T & Date)
    : Array.isArray(original)
      ? (original.map((item) => clone(item)) as T & U[])
      : original && typeof original === "object"
        ? (Object.getOwnPropertyNames(original) as (keyof T)[]).reduce<T>(
            (o, prop) => {
              const descriptor = Object.getOwnPropertyDescriptor(
                original,
                prop,
              )!
              Object.defineProperty(o, prop, {
                ...descriptor,
                writable: true, // Mark this as readable temporarily
              })
              o[prop] = clone(original[prop])

              // Refreeze if necessary
              if (descriptor.writable) {
                Object.freeze(o[prop])
              }
              return o
            },
            Object.create(Object.getPrototypeOf(original)),
          )
        : original
}

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
 */
export type RequiredSubset<T, K extends keyof T> = Flatten<{
  [k in K]-?: T[k]
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
 */
export type CheckDuplicateKey<K extends string, T> = [K] extends [StringKeys<T>]
  ? Invalid<"Duplicate keys are not allowed">
  : K
