/**
 * The set of built-in types for the SQL spec that are supported in this library
 */
export enum SQLBuiltinTypes {
  BINARY = "binary",
  BIT = "bit",
  BIGINT = "bigint",
  BLOB = "blob",
  CHAR = "char",
  CLOB = "clob",
  DATE = "date",
  DATETIME = "datetime",
  DECIMAL = "decimal",
  FLOAT = "float",
  IMAGE = "image",
  INT = "int",
  JSON = "json",
  NCHAR = "nchar",
  NTEXT = "ntext",
  NUMERIC = "numeric",
  NVARCHAR = "nvarchar",
  REAL = "real",
  SMALLINT = "smallint",
  TEXT = "text",
  TIME = "time",
  TIMESTAMP = "timestamp",
  TINYINT = "tinyint",
  VARBINARY = "varbinary",
  VARCHAR = "varchar",
  XML = "xml",
  YEAR = "year",
}

/** The set of types that are binary */
export type BinarySQLTypes =
  | SQLBuiltinTypes.BINARY
  | SQLBuiltinTypes.BLOB
  | SQLBuiltinTypes.CLOB
  | SQLBuiltinTypes.IMAGE
  | SQLBuiltinTypes.VARBINARY

/** The set of types that are related to date processing */
export type DateSQLTypes =
  | SQLBuiltinTypes.DATE
  | SQLBuiltinTypes.DATETIME
  | SQLBuiltinTypes.TIME
  | SQLBuiltinTypes.TIMESTAMP
  | SQLBuiltinTypes.YEAR

/** The set of numeric types that are potentially larger than a number can
 * support */
export type BigIntSQLTypes = SQLBuiltinTypes.BIGINT | SQLBuiltinTypes.TIMESTAMP

/** The set of types that are numeric */
export type NumericSQLTypes =
  | SQLBuiltinTypes.DECIMAL
  | SQLBuiltinTypes.FLOAT
  | SQLBuiltinTypes.INT
  | SQLBuiltinTypes.NUMERIC
  | SQLBuiltinTypes.REAL
  | SQLBuiltinTypes.SMALLINT
  | SQLBuiltinTypes.TINYINT

/** The set of types that are variable length */
export type VariableSQLTypes =
  | SQLBuiltinTypes.NVARCHAR
  | SQLBuiltinTypes.VARBINARY
  | SQLBuiltinTypes.VARCHAR

/** The set of types that are incremental */
export type IncrementalSQLTypes =
  | SQLBuiltinTypes.BIGINT
  | SQLBuiltinTypes.DECIMAL
  | SQLBuiltinTypes.FLOAT
  | SQLBuiltinTypes.INT

/** Map the SQLBuiltinType to the valid JS type */
export type TSSQLType<T extends SQLBuiltinTypes> = [T] extends [BigIntSQLTypes]
  ? number | bigint
  : [T] extends [BinarySQLTypes]
    ? Int8Array
    : [T] extends [NumericSQLTypes]
      ? number
      : [T] extends [SQLBuiltinTypes.BIT]
        ? boolean
        : string
