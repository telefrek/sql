/**
 * Join all of the strings using the given join (default ' ')
 */
export type Join<T extends string[], N extends string = " "> = T extends [
  infer Next extends string,
  ...infer Rest
]
  ? Rest extends never[]
    ? Next
    : Rest extends string[]
    ? `${Next}${N}${Join<Rest, N>}`
    : ""
  : ""

/**
 * Trim the leading/trailing whitespace characters
 *
 * Have to do manually since Regex isn't supported for string template types
 */
export type Trim<T> = T extends ` ${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest} `
  ? Trim<Rest>
  : T extends `\n${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest}\n`
  ? Trim<Rest>
  : T extends `\r${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest}\r`
  ? Trim<Rest>
  : T extends `\t${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest}\t`
  ? Trim<Rest>
  : T
