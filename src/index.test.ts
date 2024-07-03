import { createFromQueryBuilder } from "./query/builder/from.js"
import { createContext } from "./query/context.js"
import type { ParseSQL } from "./query/parser/query.js"
import { TEST_DATABASE } from "./testUtils.js"
import { SQLBuiltinTypes } from "./types.js"

describe("Schema building should create valid schemas", () => {
  // Test to verify that our schema actually matches what we defined as types
  it("The test database schema should match the type information", () => {
    expect(TEST_DATABASE).not.toBeUndefined()
    expect(TEST_DATABASE.tables).not.toBeUndefined()

    // Check the order table
    expect(TEST_DATABASE.tables.orders).not.toBeUndefined()

    // Check the key
    expect(TEST_DATABASE.tables.orders.primaryKey.column).toMatchObject([
      "user_id",
      "product_id",
    ])

    // Check the columns
    expect(TEST_DATABASE.tables.orders).not.toBeUndefined()
    expect(TEST_DATABASE.tables.orders.columns.id.type).toBe(
      SQLBuiltinTypes.BIGINT
    )
    expect(TEST_DATABASE.tables.orders.columns.id.autoIncrement).toBeTruthy()

    // Verify the default method is there and provides correct information
    expect(
      TEST_DATABASE.tables.orders.columns.order_timestamp.default
    ).not.toBeUndefined()
    expect(
      typeof TEST_DATABASE.tables.orders.columns.order_timestamp.default
    ).toBe("function")
    const defaultProvider = TEST_DATABASE.tables.orders.columns.order_timestamp
      .default as () => number
    expect(defaultProvider).not.toBeUndefined()
    expect(defaultProvider()).toBeLessThanOrEqual(Date.now())

    // Just check tables and keys
    expect(TEST_DATABASE.tables.products).not.toBeUndefined()
    expect(TEST_DATABASE.tables.products.primaryKey).not.toBeUndefined()
    expect(TEST_DATABASE.tables.products.primaryKey.column).toBe("id")

    expect(TEST_DATABASE.tables.users).not.toBeUndefined()
    expect(TEST_DATABASE.tables.users.primaryKey).not.toBeUndefined()
    expect(TEST_DATABASE.tables.users.primaryKey.column).toBe("id")

    expect(TEST_DATABASE.relations.orders_product_fk.reference).toBe("products")
    expect(TEST_DATABASE.relations.orders_product_fk.target).toBe("orders")
    expect(TEST_DATABASE.relations.orders_product_fk.targetColumns[0]).toBe(
      "product_id"
    )
    expect(TEST_DATABASE.relations.orders_product_fk.referenceColumns[0]).toBe(
      "id"
    )
  })

  it("should foo", () => {
    const queryAst: ParseSQL<"SELECT id, amount FROM orders"> =
      createFromQueryBuilder(createContext(TEST_DATABASE).context)
        .from("orders")
        .select("id", "amount").ast

    expect(queryAst).not.toBeUndefined()
  })
})
