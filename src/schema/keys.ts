import type { StringKeys } from "../type-utils/object.js"
import type { SQLBuiltinTypes } from "../types.js"
import type { SQLColumnSchema } from "./columns.js"
import type { SQLDatabaseTables, SQLTableSchema } from "./database.js"

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
 * Find a columns that are a valid type match
 */
type ForeignKeyColumnMatch<
  Table extends SQLColumnSchema,
  ColumnType extends SQLBuiltinTypes
> = {
  [Key in StringKeys<Table>]: Table[Key]["type"] extends ColumnType
    ? Table[Key]["nullable"] extends true
      ? never
      : Key
    : never
}[StringKeys<Table>]

type CompositeForeignKeyColumnMatch<
  Table extends SQLColumnSchema,
  Columns extends SQLBuiltinTypes[]
> = Columns extends [infer Next extends SQLBuiltinTypes, ...infer Rest]
  ? Rest extends never[]
    ? [ForeignKeyColumnMatch<Table, Next>]
    : Rest extends SQLBuiltinTypes[]
    ? [
        ForeignKeyColumnMatch<Table, Next>,
        ...CompositeForeignKeyColumnMatch<Table, Rest>
      ]
    : never
  : never

type ExtractCompositeKeyTypes<
  Table extends SQLColumnSchema,
  Columns extends StringKeys<Table>[]
> = Columns extends [infer Column extends StringKeys<Table>, ...infer Rest]
  ? Rest extends never[]
    ? [Table[Column]["type"]]
    : Rest extends StringKeys<Table>[]
    ? [Table[Column]["type"], ...ExtractCompositeKeyTypes<Table, Rest>]
    : never
  : never

export type ForeignKeyColumns<
  Database extends SQLDatabaseTables,
  Source extends ForeignKeySourceTables<Database>,
  Destination extends StringKeys<Database>
> = GetPrimaryKey<Database[Source]> extends SingleKey<
  Database[Source]["columns"],
  infer Column extends StringKeys<Database[Source]["columns"]>
>
  ? [
      ForeignKeyColumnMatch<
        Database[Destination]["columns"],
        Database[Source]["columns"][Column]["type"]
      >
    ]
  : GetPrimaryKey<Database[Source]> extends CompositeKey<
      Database[Source]["columns"],
      infer Columns extends StringKeys<Database[Source]["columns"]>[]
    >
  ? CompositeForeignKeyColumnMatch<
      Database[Destination]["columns"],
      ExtractCompositeKeyTypes<Database[Source]["columns"], Columns>
    >
  : never

/**
 * Get candidate tables that have a defined primary key
 */
export type ForeignKeySourceTables<Schema extends SQLDatabaseTables> = {
  [Key in StringKeys<Schema>]: Schema[Key] extends SQLTableSchema<
    infer TableSchema
  >
    ? Schema[Key] extends SQLTableSchema<
        TableSchema,
        infer _ extends PrimaryKey<TableSchema>
      >
      ? Key
      : never
    : never
}[StringKeys<Schema>]

export type GetPrimaryKey<Schema extends SQLTableSchema> =
  Schema extends SQLTableSchema<infer Columns>
    ? Schema extends SQLTableSchema<
        Columns,
        infer PK extends PrimaryKey<Columns>
      >
      ? PK
      : never
    : never

/**
 * Defines a foreign key
 */
export type ForeignKey<
  Database extends SQLDatabaseTables,
  Source extends ForeignKeySourceTables<Database> = ForeignKeySourceTables<Database>,
  Destination extends StringKeys<Database> = StringKeys<Database>,
  Columns extends ForeignKeyColumns<
    Database,
    Source,
    Destination
  > = ForeignKeyColumns<Database, Source, Destination>
> = {
  source: Source
  sourceColumns: GetPrimaryKey<Database[Source]>["column"]
  destination: Destination
  destinationColumns: Columns
}
