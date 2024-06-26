// @ts-check

// @ts-expect-error This is a known issue pulling in eslint/js
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-unused-vars": "off",
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-warning-comments": 1,
    },
    ignores: ["**/*.config.js", "**/node_modules", "**/dist", "**/*.d.ts"],
  }
)
