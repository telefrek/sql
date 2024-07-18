import { TEST_DATABASE, testDatabaseEngine } from "@telefrek/sql/testUtils"
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import pg from "pg"
import { createPostgresEngine, initializePostgres } from "./engine.js"

const CREATE_TABLE = `
    CREATE TABLE orders (
        id BIGSERIAL NOT NULL,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        order_timestamp TIMESTAMP DEFAULT now(),
        amount DECIMAL(10, 4) NOT NULL,
        PRIMARY KEY (user_id, product_id)
    )
`

const INSERT_ROW = `
    INSERT INTO orders(user_id, product_id, amount) VALUES (1, 1, 10.0000)
`

describe("All integration tests with postgres should pass", () => {
  let container: StartedPostgreSqlContainer
  let client: pg.Client
  beforeAll(async () => {
    container = await new PostgreSqlContainer(
      "postgres@sha256:0aafd2ae7e6c391f39fb6b7621632d79f54068faebc726caf469e87bd1d301c0",
    ).start()

    client = new pg.Client({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    })
    await client.connect()
    initializePostgres(client)

    await client.query(CREATE_TABLE)
    await client.query(INSERT_ROW)
  }, 15_000)

  afterAll(async () => {
    if (client) {
      await client.end()
    }

    if (container) {
      await container.stop()
    }
  })

  it("Should be able to issue a simple select", async () => {
    await testDatabaseEngine(createPostgresEngine(TEST_DATABASE))
  })
})
