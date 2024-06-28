/**
 * This is a helper for our future testing
 */

import { createSchemaBuilder } from "./schemaBuilder.js"
import { SQLBuiltinTypes } from "./types.js"

/**
 * A simple test database with three tables for a user, product and orders of a
 * product by a user
 */
export const TEST_DATABASE = createSchemaBuilder()
  .addTable("users", (table) =>
    table
      .addColumn("id", SQLBuiltinTypes.BIGINT, { autoIncrement: true })
      .addColumn("first_name", SQLBuiltinTypes.TEXT)
      .addColumn("last_name", SQLBuiltinTypes.TEXT)
      .addColumn("address", SQLBuiltinTypes.TEXT)
      .addColumn("email", SQLBuiltinTypes.TEXT)
      .withKey("id")
  )
  .addTable("orders", (table) =>
    table
      .addColumn("id", SQLBuiltinTypes.BIGINT, { autoIncrement: true })
      .addColumn("user_id", SQLBuiltinTypes.BIGINT)
      .addColumn("product_id", SQLBuiltinTypes.BIGINT)
      .addColumn("amount", SQLBuiltinTypes.DECIMAL)
      .withKey("user_id", "product_id")
  )
  .addTable("products", (table) =>
    table
      .addColumn("id", SQLBuiltinTypes.BIGINT, { autoIncrement: true })
      .addColumn("name", SQLBuiltinTypes.TEXT)
      .addColumn("description", SQLBuiltinTypes.TEXT)
      .withKey("id")
  ).schema
