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

/** The set of numeric types that have options for sizing */
export type VariableNumericTypes =
  | SQLBuiltinTypes.DECIMAL
  | SQLBuiltinTypes.FLOAT
  | SQLBuiltinTypes.NUMERIC
  | SQLBuiltinTypes.REAL

/** The set of types that are variable length */
export type VariableLengthSQLTypes =
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
  ? Uint8Array
  : [T] extends [NumericSQLTypes]
  ? number
  : [T] extends [SQLBuiltinTypes.BIT]
  ? boolean
  : string

/** This is a test for numbers that should fit under the Number.MAX_SAFE_INT */
const SAFE_INT_REGEX = /^(-)?[0-8]?\d{1,15}$/

/** This is NOT a test for a VALID regex, but simply a way to quickly identify
 * strings that are likely UTC dates */
const UTC_REGEX_TEST = /^\d{4}-\d{2}-\d{2}[ tT]\d{2}:\d{2}:\d{2}.*[zZ]?$/

/**
 * Parse the value as a number or bigint
 *
 * @param value The value to parse as a bigint or number
 * @returns A number if in the safe range or bigint
 */
export function parseSafeBigInt(value: string): number | bigint {
  return SAFE_INT_REGEX.test(value)
    ? Number(value) // If number is less than 16 digits that start with a 9 we don't care
    : (value.startsWith("-") ? value.substring(1) : value) > "9007199254740991"
    ? BigInt(value)
    : Number(value)
}

/**
 * Parse the date string value as a safe bigint or number
 *
 * @param value The value to parse as a date into a bigint or number
 * @returns A number if in the safe range or bigint
 */
export function parseDateToSafeBigInt(value: string): number | bigint {
  return UTC_REGEX_TEST.test(value) ? Date.parse(value) : parseSafeBigInt(value)
}
