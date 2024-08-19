import { normalizeQuery } from "./normalize.js"
import { DefaultOptions } from "./options.js"

describe("SQL query strings should be appropriately normalized", () => {
  describe("Filters should be appropriately handled", () => {
    it("Should split out comparisons in a where clause", () => {
      const query = "SELECT * FROM t WHERE id>=1 AND id=(1%2)"
      expect(normalizeQuery(query, DefaultOptions)).toBe(
        "SELECT * FROM t WHERE id >= 1 AND id = ( 1 % 2 )"
      )
    })

    it("Should split out set operations in an update clause", () => {
      const query = "UPDATE t SET a&=1,b=(2+3/4)"
      expect(normalizeQuery(query, DefaultOptions)).toBe(
        "UPDATE t SET a &= 1 , b = ( 2 + 3 / 4 )"
      )
    })
  })
})
