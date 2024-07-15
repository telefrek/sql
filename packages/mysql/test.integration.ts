import { TEST_DATABASE, testDatabaseEngine } from "@telefrek/sql/testUtils"
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql"
import mysql from "mysql2/promise"
import { createMySQLEngine, initializeMySQL } from "./engine.js"

const CREATE_TABLE = `
    CREATE TABLE orders (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        order_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL(10, 4) NOT NULL,
        PRIMARY KEY (user_id, product_id),
        KEY \`idInc\` (\`id\`)
    )
`

const INSERT_ROW = `
    INSERT INTO orders(user_id, product_id, amount) VALUES (1, 1, 10.0000)
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

    await connection.query(CREATE_TABLE)
    await connection.query(INSERT_ROW)
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
