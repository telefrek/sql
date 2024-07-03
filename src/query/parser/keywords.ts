export type FromKeywords = "WHERE" | OptionKeywords | JoinKeywords
export type JoinKeywords =
  | "INNER"
  | "OUTER"
  | "LEFT"
  | "RIGHT"
  | "FULL"
  | "JOIN"
export type OptionKeywords = "HAVING" | "GROUP" | "OFFSET" | "LIMIT"
