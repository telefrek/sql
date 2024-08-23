import { parseArithmeticExpression } from "./arithmetic.js"
import { DefaultOptions } from "./options.js"

describe("Arithmetic parsing should correctly extract types and values", () => {
  it("Should be able to parse a simple value completely", () => {
    const ret = parseArithmeticExpression("a + b", DefaultOptions)
    expect(ret).not.toBeUndefined()
    expect(ret.left.type).toBe("ColumnReference")
    expect(ret.left.alias).toBe("a")

    expect(ret.operation).toBe("+")

    expect(ret.right.type).toBe("ColumnReference")
    expect(ret.right.alias).toBe("b")
  })
})
