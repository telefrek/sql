/**
 * The options for what can be overridden in the parsing logic
 */
export type ParserOptions = {
  quote: string
  quoteTables: boolean
}

export const DefaultOptions: ParserOptions = {
  quote: "'",
  quoteTables: false,
}

export type DEFAULT_PARSER_OPTIONS = typeof DefaultOptions
