import { TEST_DATABASE, testDatabaseEngine } from "@telefrek/sql/test.utils"
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import pg from "pg"
import { createPostgresEngine, initializePostgres } from "./engine.js"

const CREATE_ORDERS = `
    CREATE TABLE orders (
        id BIGSERIAL NOT NULL,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        order_timestamp TIMESTAMP DEFAULT now(),
        amount DECIMAL(10, 4) NOT NULL,
        PRIMARY KEY (user_id, product_id)
    )`

const CREATE_USERS = `
    CREATE TABLE users (
      id BIGSERIAL NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      PRIMARY KEY (id)
    )`

const CREATE_PRODUCTS = `
    CREATE TABLE products (
      id BIGSERIAL NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      PRIMARY KEY (id)
    )`

describe("All integration tests with postgres should pass", () => {
  let container: StartedPostgreSqlContainer
  let client: pg.Client
  beforeAll(async () => {
    container = await new PostgreSqlContainer(
      "postgres@sha256:0aafd2ae7e6c391f39fb6b7621632d79f54068faebc726caf469e87bd1d301c0"
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

    await client.query(CREATE_ORDERS)
    await client.query(CREATE_PRODUCTS)
    await client.query(CREATE_USERS)
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
