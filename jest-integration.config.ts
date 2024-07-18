import type { JestConfigWithTsJest } from "ts-jest"

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",
  testMatch: ["<rootDir>/**/*.integration.ts"],
  moduleNameMapper: {
    "^@telefrek/(.*)\\.js$": "<rootDir>/packages/$1/",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
}

export default jestConfig
