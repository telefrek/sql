/**
 * The set of terminal keywords for extracting the FROM segment of a select
 */
export type FromKeywords = "WHERE" | OptionKeywords | JoinKeywords

/**
 * The set of terminal keywords for extracting the JOIN segment of a select
 */
export type JoinKeywords =
  | "INNER"
  | "OUTER"
  | "LEFT"
  | "RIGHT"
  | "FULL"
  | "JOIN"
  | "LATERAL"

/**
 * The set of optional select keywords that have meaning for processing clauses
 */
export type OptionKeywords =
  | "HAVING"
  | "GROUP"
  | "OFFSET"
  | "LIMIT"
  | "ORDER"
  | "BY"

/**
 * The set of logical keys that affect grouping in filters
 */
export const LOGICAL_KEYS = ["AND", "OR", "NOT"]

/**
 * The set of keys that hint at the type of query being processed
 */
export const QUERY_KEYS = ["SELECT", "UPDATE", "INSERT", "DELETE", "WITH"]

/**
 * The set of keys that indicate the end of the where clause
 */
export const WHERE_KEYS = ["HAVING", "GROUP", "OFFSET", "LIMIT", "ORDER"]

/**
 * The set of keys that indicate the end of a join clause
 */
export const JOIN_KEYS = [
  "JOIN",
  "OUTER",
  "INNER",
  "FULL",
  "LEFT",
  "RIGHT",
  "LATERAL",
]

/**
 * The set of keys that indicate the from clause has ended
 */
export const FROM_KEYS = ["WHERE", ...WHERE_KEYS, ...JOIN_KEYS]

/**
 * The full set of all keys
 */
export const NORMALIZE_TARGETS = [
  ...QUERY_KEYS,
  ...FROM_KEYS,
  ...LOGICAL_KEYS,
  "FROM",
  "AS",
  "UNION",
  "EXTRACT",
  "MINUS",
  "INTERSECT",
  "ON",
  "SET",
]
