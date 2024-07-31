import { TEST_DATABASE, testDatabaseEngine } from "@telefrek/sql/test.utils"
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql"
import mysql from "mysql2/promise"
import { createMySQLEngine, initializeMySQL } from "./engine.js"

const CREATE_ORDERS = `
    CREATE TABLE orders (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        order_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL(10, 4) NOT NULL,
        PRIMARY KEY (user_id, product_id),
        KEY \`idInc\` (\`id\`)
    )`

const CREATE_USERS = `
    CREATE TABLE users (
      id BIGINT NOT NULL AUTO_INCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )`

const CREATE_PRODUCTS = `
    CREATE TABLE products (
      id BIGINT NOT NULL AUTO_INCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      PRIMARY KEY (id)
    )
`

describe("All integration tests with postgres should pass", () => {
  let container: StartedMySqlContainer
  let connection: mysql.Connection
  beforeAll(async () => {
    container = await new MySqlContainer(
      "mysql@sha256:72a37ddc9f839cfd84f1f6815fb31ba26f37f4c200b90e49607797480e3be446"
    ).start()

    connection = await mysql.createConnection(container.getConnectionUri())
    initializeMySQL(connection)

    await connection.query(CREATE_ORDERS)
    await connection.query(CREATE_USERS)
    await connection.query(CREATE_PRODUCTS)
  }, 30_000)

  afterAll(async () => {
    if (connection) {
      await connection.end()
    }

    if (container) {
      await container.stop()
    }
  })

  it("Should be able to issue a simple select", async () => {
    await testDatabaseEngine(createMySQLEngine(TEST_DATABASE))
  })
})
