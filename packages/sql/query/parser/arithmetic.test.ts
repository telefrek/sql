import { parseArithmeticExpression } from "./arithmetic.js"
import { DefaultOptions } from "./options.js"

describe("Arithmetic parsing should correctly extract types and values", () => {
  it("Should consume the correct amount of tokens", () => {
    const tokens = "a + b OR c".split(" ")

    const ret = parseArithmeticExpression(tokens, DefaultOptions)
    const partial = parseArithmeticExpression("a + b", DefaultOptions)
    expect(ret).not.toBeUndefined()
    expect(ret).toStrictEqual(partial)
    expect(tokens.length).toBe(2)
    expect(tokens).toStrictEqual(["OR", "c"])
  })

  it("Should not consume an invalid set of tokens", () => {
    const tokens = "( a + b + c / d".split(" ")

    const ret = parseArithmeticExpression(tokens, DefaultOptions)
    expect(ret).toBeUndefined()
    expect(tokens).toStrictEqual(["(", "a", "+", "b", "+", "c", "/", "d"])
  })

  it("Should be able to parse a group value", () => {
    const ret = parseArithmeticExpression("( a + b )", DefaultOptions)
    expect(ret).not.toBeUndefined()
    expect(ret.type).toBe("GroupedArithmeticExpression")
    expect(ret.expression).toStrictEqual({
      type: "ArithmeticExpression",
      left: {
        type: "ColumnReference",
        reference: {
          type: "UnboundColumnReference",
          column: "a",
        },
        alias: "a",
      },
      operation: "+",
      right: {
        type: "ColumnReference",
        reference: {
          type: "UnboundColumnReference",
          column: "b",
        },
        alias: "b",
      },
    })
  })

  it("Should be able to parse a simple value completely", () => {
    const ret = parseArithmeticExpression("a + b + c", DefaultOptions)

    expect(ret).not.toBeUndefined()
    expect(ret).toStrictEqual({
      type: "ArithmeticExpression",
      left: {
        type: "ArithmeticExpression",
        left: {
          type: "ColumnReference",
          reference: {
            type: "UnboundColumnReference",
            column: "a",
          },
          alias: "a",
        },
        operation: "+",
        right: {
          type: "ColumnReference",
          reference: {
            type: "UnboundColumnReference",
            column: "b",
          },
          alias: "b",
        },
      },
      operation: "+",
      right: {
        type: "ColumnReference",
        reference: {
          type: "UnboundColumnReference",
          column: "c",
        },
        alias: "c",
      },
    })
  })
})
