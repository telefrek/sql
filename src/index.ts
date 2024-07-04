/**
 * This is the entrypoint for SQL management
 */

export { getDatabase, type SQLDatabase } from "./database.js"
export { createQueryBuilder } from "./query/builder/query.js"
export type { ParseSQL } from "./query/parser/query.js"
export { createDatabaseSchema } from "./schema/builder/database.js"
export { SQLBuiltinTypes } from "./types.js"
