export type FromKeywords = "WHERE" | OptionKeywords | JoinKeywords
export type JoinKeywords =
  | "INNER"
  | "OUTER"
  | "LEFT"
  | "RIGHT"
  | "FULL"
  | "JOIN"
export type OptionKeywords = "HAVING" | "GROUP" | "OFFSET" | "LIMIT"

export const LOGICAL_KEYS = ["AND", "OR", "NOT"]

export const QUERY_KEYS = ["SELECT", "UPDATE", "INSERT", "DELETE", "WITH"]

export const WHERE_KEYS = ["WHERE", "HAVING", "ORDER", "BY", "LIMIT", "OFFSET"]

export const JOIN_KEYS = [
  "JOIN",
  "OUTER",
  "INNER",
  "FULL",
  "LEFT",
  "RIGHT",
  "LATERAL",
]

export const FROM_KEYS = [...WHERE_KEYS, ...JOIN_KEYS]

export const NORMALIZE_TARGETS = [
  ...QUERY_KEYS,
  ...FROM_KEYS,
  ...LOGICAL_KEYS,
  "FROM",
  "AS",
  "UNION",
  "EXTRACT",
  "INTERSECT",
  "ON",
]
