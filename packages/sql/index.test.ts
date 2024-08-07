import type { ParseSQL } from "./index.js"
import { createQueryBuilder, getDatabase, SQLBuiltinTypes } from "./index.js"
import { normalizeQuery } from "./query/parser/normalize.js"
import { createParsingOptions, DefaultOptions } from "./query/parser/options.js"
import { DefaultQueryVisitor } from "./query/visitor/common.js"
import { TEST_DATABASE } from "./test.utils.js"

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
    expect(TEST_DATABASE.tables.products.primaryKey.column).toMatchObject([
      "id",
    ])

    expect(TEST_DATABASE.tables.users).not.toBeUndefined()
    expect(TEST_DATABASE.tables.users.primaryKey).not.toBeUndefined()
    expect(TEST_DATABASE.tables.users.primaryKey.column).toMatchObject(["id"])

    expect(TEST_DATABASE.relations.orders_product_fk.reference).toBe("products")
    expect(TEST_DATABASE.relations.orders_product_fk.target).toBe("orders")
    expect(TEST_DATABASE.relations.orders_product_fk.targetColumns[0]).toBe(
      "product_id"
    )
    expect(TEST_DATABASE.relations.orders_product_fk.referenceColumns[0]).toBe(
      "id"
    )
  })
})

/**
 * Most of these tests only validate not-undefined since they are a check
 * against the Invalid type returned from the type system itself.
 */
describe("Invalid queries should be rejected", () => {
  describe("Invalid select should be rejected", () => {
    it("Should reject a select with no from", () => {
      const bad: ParseSQL<"SELECT column"> = "Missing FROM"
      expect(bad).not.toBeUndefined()
    })

    it("Should reject a select with columns missing commas", () => {
      const bad: ParseSQL<"SELECT col col col FROM table"> =
        "Column missing commas: col col col"
      expect(bad).not.toBeUndefined()
    })

    it("Should reject a select with no columns", () => {
      const bad: ParseSQL<"SELECT FROM table"> = "Invalid empty column"
      expect(bad).not.toBeUndefined()
    })

    it("Should reject an insert without a values", () => {
      const bad: ParseSQL<"INSERT INTO table(id)"> =
        "VALUES or SELECT are required for INSERT"
      expect(bad).not.toBeUndefined()
    })

    it("Should reject an insert without a table", () => {
      const bad: ParseSQL<"INSERT INTO (id) VALUES (1)"> =
        "Table is required for INSERT"
      expect(bad).not.toBeUndefined()
    })
  })
})

describe("Query visitors should produce equivalent SQL", () => {
  it("Should be able to return a simple select", () => {
    const queryString = "SELECT * FROM orders"
    const query = getDatabase(TEST_DATABASE).parseSQL(queryString)
    const visitor = new DefaultQueryVisitor()
    visitor.visitQuery(query)
    expect(normalizeQuery(visitor.sql)).toBe(normalizeQuery(queryString))
  })

  it("Should be able to return a select with columns", () => {
    const queryString = "SELECT id, user_id FROM orders"
    const query = getDatabase(TEST_DATABASE).parseSQL(queryString)
    const visitor = new DefaultQueryVisitor()
    visitor.visitQuery(query)
    expect(normalizeQuery(visitor.sql)).toBe(normalizeQuery(queryString))
  })

  it("Should be able to return a select with alias", () => {
    const queryString = "SELECT id AS order_id, user_id FROM orders AS o"
    const query = getDatabase(TEST_DATABASE).parseSQL(queryString)
    const visitor = new DefaultQueryVisitor()
    visitor.visitQuery(query)
    expect(normalizeQuery(visitor.sql)).toBe(normalizeQuery(queryString))
  })

  it("Should be able to return an insert with no return", () => {
    const queryString =
      "INSERT INTO users(first_name, last_name) VALUES('firstName', 'lastName')"
    const query = getDatabase(TEST_DATABASE).parseSQL(queryString)
    const visitor = new DefaultQueryVisitor()
    visitor.visitQuery(query)
    expect(normalizeQuery(visitor.sql)).toBe(normalizeQuery(queryString))
  })

  it("Should be able to return an insert with a return", () => {
    const queryString =
      "INSERT INTO users(first_name) VALUES('firstName') RETURNING id AS userId"
    const query = getDatabase(TEST_DATABASE).parseSQL(queryString)
    const visitor = new DefaultQueryVisitor()
    visitor.visitQuery(query)
    expect(normalizeQuery(visitor.sql)).toBe(normalizeQuery(queryString))
  })
})

describe("Query building should match parsers", () => {
  it("Should identify a simple select statement", () => {
    const query: ParseSQL<"SELECT * FROM orders"> = createQueryBuilder(
      TEST_DATABASE,
      DefaultOptions
    ).select.from("orders").ast
    expect(query).not.toBeUndefined()
    expect(query.query.columns).toBe("*")
    expect(query.query.from.alias).toBe("orders")
  })

  it("Should allow a simple select statement with from alias", () => {
    const query: ParseSQL<"SELECT * from products as p"> = createQueryBuilder(
      TEST_DATABASE,
      DefaultOptions
    ).select.from("products AS p").ast
    expect(query).not.toBeUndefined()
    expect(query.query.columns).toBe("*")
    expect(query.query.from.alias).toBe("p")
    expect(query.query.from.table).toBe("products")
  })

  it("Should allow a simple select statement with a column alias", () => {
    const query: ParseSQL<"SELECT id as user_id FROM users"> =
      createQueryBuilder(TEST_DATABASE, DefaultOptions)
        .select.from("users")
        .columns("id AS user_id").ast
    expect(query).not.toBeUndefined()
    expect(
      query.query.columns.find((c) => c.alias === "user_id")!.reference.column
    ).toBe("id")
  })

  it("Should allow a simple insert statement with returning all columns", () => {
    const query: ParseSQL<`INSERT INTO users(first_name, last_name) VALUES('firstName', 'lastName') RETURNING *`> =
      createQueryBuilder(TEST_DATABASE, DefaultOptions)
        .insert.into("users")
        .columns("first_name", "last_name")
        .values("firstName", "lastName").returningRow

    expect(query.query.type).toBe("InsertClause")
    expect(query.query.returning).toBe("*")
  })

  it("Should allow a simple insert statement with returning a subset of columns", () => {
    const query: ParseSQL<`INSERT INTO users(first_name, last_name) VALUES('firstName', 'lastName') RETURNING id, first_name as firstName, created_at`> =
      createQueryBuilder(TEST_DATABASE, DefaultOptions)
        .insert.into("users")
        .columns("first_name", "last_name")
        .values("firstName", "lastName")
        .returning("id", "first_name AS firstName", "created_at")

    expect(query.query.type).toBe("InsertClause")
    expect(query.query.returning.length).toBe(3)
    expect(query.query.returning[0].reference.column).toBe("id")
    expect(query.query.returning[1].alias).toBe("firstName")
  })

  it("Should allow a simple insert statement without returning", () => {
    const query: ParseSQL<"INSERT INTO users(first_name, last_name, address, email) VALUES('firstName', 'lastName', '12345 make believe way', 'first@last.name')"> =
      createQueryBuilder(TEST_DATABASE, DefaultOptions)
        .insert.into("users")
        .columns("first_name", "last_name", "address", "email")
        .values(
          "firstName",
          "lastName",
          "12345 make believe way",
          "first@last.name"
        ).ast

    expect(query).not.toBeUndefined()
    expect(query.query.columns[0].alias).toBe("first_name")
    expect(query.query.values[0].value).toBe("firstName")
  })

  it.skip("Should allow a simple select statement with a column and table alias that is joined", () => {
    // We won't run this test for now since it only applies to non-unique
    // columns when we join.  We want to limit the number of combinations of table.column or
    // column types for the select clause since it causes a LOT of type explosion
  })
})

describe("SQL parsing logic should be customizable", () => {
  it("Should be able to change quotes", () => {
    const q1 = getDatabase(TEST_DATABASE, DefaultOptions).parseSQL(
      "SELECT * FROM users"
    )

    const options = createParsingOptions({ quote: "`" }, "QUOTED_TABLES")

    const q2 = getDatabase(TEST_DATABASE, options).parseSQL(
      "SELECT * FROM `users`"
    )

    expect(q1).toStrictEqual(q2)
  })
})

describe("SQL databases should validate queries", () => {
  it("Should allow creating a query from a raw string with aliasing", () => {
    const database = getDatabase(TEST_DATABASE, DefaultOptions)
    expect(database).not.toBeUndefined()

    const query = database.parseSQL(
      "SELECT o.id as product_id FROM products AS o"
    )
    expect(
      query.query.columns.find((c) => c.alias === "product_id")!.reference
        .column
    ).toBe("id")
    expect(
      query.query.columns.find((c) => c.alias === "product_id")?.reference.table
    ).toBe("o")
    expect(query.query.from.table).toBe("products")
    expect(query.query.from.alias).toBe("o")
  })

  it("Should allow creating a simple query from a raw string", () => {
    const query = getDatabase(TEST_DATABASE, DefaultOptions).parseSQL(
      "SELECT * FROM orders"
    )
    expect(query.query.type).toBe("SelectClause")
    expect(query.query.from.table).toBe("orders")
  })
})
