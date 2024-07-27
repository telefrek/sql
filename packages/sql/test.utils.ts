/**
 * This is a helper for our future testing
 */

import { getDatabase, type SQLDatabase } from "./database.js"
import type { DatabaseEngine } from "./engines/common.js"
import { DefaultOptions, type ParserOptions } from "./query/parser/options.js"
import { createDatabaseSchema } from "./schema/builder/database.js"
import { SQLBuiltinTypes } from "./types.js"

/**
 * A simple test database with three tables for a user, product and orders of a
 * product by a user
 */
export const TEST_DATABASE = createDatabaseSchema()
  .addTable("users", (table) =>
    table
      .addColumn("id", SQLBuiltinTypes.BIGINT, { autoIncrement: true })
      .addColumn("first_name", SQLBuiltinTypes.TEXT)
      .addColumn("last_name", SQLBuiltinTypes.TEXT)
      .addColumn("address", SQLBuiltinTypes.TEXT, { nullable: true })
      .addColumn("email", SQLBuiltinTypes.TEXT)
      .addColumn("created_at", SQLBuiltinTypes.TIMESTAMP, {
        nullable: true,
        default: () => Date.now(),
      })
      .withKey("id")
  )
  .addTable("orders", (table) =>
    table
      .addColumn("id", SQLBuiltinTypes.BIGINT, { autoIncrement: true })
      .addColumn("user_id", SQLBuiltinTypes.BIGINT)
      .addColumn("product_id", SQLBuiltinTypes.BIGINT)
      .addColumn("order_timestamp", SQLBuiltinTypes.TIMESTAMP, {
        nullable: true,
        default: () => Date.now(),
      })
      .addColumn("amount", SQLBuiltinTypes.DECIMAL)
      .withKey("user_id", "product_id")
  )
  .addTable("products", (table) =>
    table
      .addColumn("id", SQLBuiltinTypes.BIGINT, { autoIncrement: true })
      .addColumn("name", SQLBuiltinTypes.TEXT)
      .addColumn("description", SQLBuiltinTypes.TEXT)
      .withKey("id")
  )
  .addForeignKey("orders_product_fk", "products", "orders", "product_id").schema

/**
 * The type of our TEST_DATABASE object
 */
export type DB_TYPE = typeof TEST_DATABASE

/**
 * Run a query test against an engine to validate it works
 *
 * @param engine The {@link DatabaseEngine} to test against
 */
export async function testDatabaseEngine(
  engine: DatabaseEngine<DB_TYPE>,
  options: ParserOptions = DefaultOptions
): Promise<void> {
  expect(engine).not.toBeUndefined()

  const database = getDatabase(TEST_DATABASE, options)

  // Create the primitives
  await createOrders(engine, database)

  const queryString = "SELECT * FROM orders"
  const query = database.parseSQL(queryString)
  const submittable = engine.translateQuery("test", query)
  const res = await engine.execute(submittable)

  expect(res.length).toBe(1)
  expect(res[0].id).toBe(1)
  expect(res[0].amount).toBe(10)
  expect(res[0].product_id).toBe(1)
  expect(res[0].user_id).toBe(1)

  const query2 = database.parseSQL(
    "SELECT o.id, o.user_id AS userId, product_id AS productId FROM orders AS o"
  )

  const submittable2 = engine.translateQuery("test2", query2)
  const res2 = await engine.execute(submittable2)
  expect(res2.length).toBe(1)
  expect(res2[0].id).toBe(1)
  expect(res2[0].userId).toBe(1)
  expect(res2[0].productId).toBe(1)
}

async function createOrders<
  Engine extends DatabaseEngine<DB_TYPE>,
  Database extends SQLDatabase<DB_TYPE>
>(engine: Engine, database: Database): Promise<void> {
  const userId = await createUser(engine, database)
  expect(userId).toBe(1)

  // TODO: In the future, use parameterized values to drive this
  const insertOrder = database.parseSQL(
    "INSERT INTO orders(user_id, product_id, amount) VALUES (1, 1, 10.0000)"
  )

  const insertRes = await engine.execute(
    engine.translateQuery("insertOrder", insertOrder)
  )
  expect(insertRes).toBe(1)
}

async function createUser<
  Engine extends DatabaseEngine<DB_TYPE>,
  Database extends SQLDatabase<DB_TYPE>
>(engine: Engine, database: Database): Promise<number | bigint> {
  try {
    const insertUser = database.parseSQL(
      "INSERT INTO users(first_name, last_name, address, email) VALUES('firstName', 'lastName', 'address', 'email') RETURNING id"
    )
    const userRes = await engine.execute(
      engine.translateQuery("insertUser", insertUser)
    )
    expect(userRes).not.toBeUndefined()
    expect(userRes.length).toBe(1)
    expect(userRes[0].id).toBe(1)
  } catch {
    const insertUser = database.parseSQL(
      "INSERT INTO users(first_name, last_name, address, email) VALUES('firstName', 'lastName', 'address', 'email')"
    )
    const userRes = await engine.execute(
      engine.translateQuery("insertUser", insertUser)
    )

    expect(userRes).toBe(1)
  }

  return 1
}
