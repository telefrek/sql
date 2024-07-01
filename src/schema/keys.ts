import type { StringKeys } from "../type-utils/object.js"
import type { SQLColumnSchema, ValidForeignKeyTargets } from "./columns.js"

/**
 * Represents a type of primray key
 */
export type PrimaryKey<Schema extends SQLColumnSchema> =
  | SingleKey<Schema, StringKeys<Schema>>
  | CompositeKey<Schema, StringKeys<Schema>[]>

/**
 * Represents a single column key
 */
export type SingleKey<
  Schema extends SQLColumnSchema,
  Column extends StringKeys<Schema>
> = {
  column: Column
}

/**
 * Represents a composite column key
 */
export type CompositeKey<
  Schema extends SQLColumnSchema,
  Columns extends StringKeys<Schema>[]
> = {
  column: Columns
}

/**
 * Defines a foreign key
 */
export type ForeignKey<
  Source extends SQLColumnSchema = SQLColumnSchema,
  SourceKey extends PrimaryKey<Source> = PrimaryKey<Source>,
  Destination extends SQLColumnSchema = SQLColumnSchema
> = SourceKey extends SingleKey<Source, infer Column>
  ? {
      source: Source
      key: SingleKey<Source, Column>
      destination: Destination
      column: ValidForeignKeyTargets<Source, Column, Destination>
    }
  : SourceKey extends CompositeKey<Source, infer Columns>
  ? Columns extends infer T extends StringKeys<Source>[]
    ? T extends StringKeys<Source>
      ? {
          source: Source
          key: CompositeKey<Source, Columns>
          destination: Destination
          column: ValidForeignKeyTargets<Source, T, Destination>[]
        }
      : never
    : never
  : never
