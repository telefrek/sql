/**
 * This is a helper for our future testing
 */

import { getDatabase } from "./database.js"
import type { DatabaseEngine } from "./engines/common.js"
import { DefaultOptions } from "./query/parser/options.js"
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
      .addColumn("created_at", SQLBuiltinTypes.TIMESTAMP, {
        nullable: true,
        default: () => Date.now(),
      })
      .addColumn("email", SQLBuiltinTypes.TEXT)
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
  engine: DatabaseEngine<DB_TYPE>
): Promise<void> {
  expect(engine).not.toBeUndefined()

  const queryString = "SELECT * FROM orders"
  const query = getDatabase(TEST_DATABASE).parseSQL(queryString, DefaultOptions)
  const submittable = engine.translateQuery("test", query)
  const res = await engine.execute(submittable)

  expect(res.length).toBe(1)
  expect(res[0].id).toBe(1)
  expect(res[0].amount).toBe(10)
  expect(res[0].product_id).toBe(1)
  expect(res[0].user_id).toBe(1)

  const query2 = getDatabase(TEST_DATABASE).parseSQL(
    "SELECT o.id, o.user_id AS userId, product_id AS productId FROM orders AS o",
    DefaultOptions
  )

  const submittable2 = engine.translateQuery("test2", query2)
  const res2 = await engine.execute(submittable2)
  expect(res2.length).toBe(1)
  expect(res2[0].id).toBe(1)
  expect(res2[0].userId).toBe(1)
  expect(res2[0].productId).toBe(1)
}
