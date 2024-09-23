import { parseAllExpressionTokens } from "./expressions.js"
import { normalizeQuery } from "./normalize.js"
import { DefaultOptions } from "./options.js"

describe("Expression parsing should work for all value types", () => {
  it("Should handle parsing something", () => {
    const tokens = normalizeQuery("a + b OR c + d", DefaultOptions).split(" ")
    const result = JSON.stringify(
      parseAllExpressionTokens(tokens, DefaultOptions),
      undefined,
      2
    )
    expect(result).not.toBeUndefined()
  })
})
