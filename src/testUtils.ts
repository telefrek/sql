/**
 * This is a helper for our future testing
 */

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
