/**
 * The options for what can be overridden in the parsing logic
 */
export type ParserOptions<
  Quote extends string = string,
  QT extends boolean = boolean
> = {
  quote: Quote
  quoteTables: QT
}

export const DefaultOptions: ParserOptions<"'", false> = {
  quote: "'",
  quoteTables: false,
}

export type DEFAULT_PARSER_OPTIONS = ParserOptions<"'", false>

export type CheckQuoteTables<Options extends ParserOptions> =
  Options extends ParserOptions<infer _, infer Quote> ? Quote : never

export type GetQuote<Options extends ParserOptions> =
  Options extends ParserOptions<infer Quote, infer _> ? Quote : never
