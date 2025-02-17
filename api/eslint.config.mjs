import tsParser from "@typescript-eslint/parser"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"
import { includeIgnoreFile } from "@eslint/compat"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, "../.gitignore")

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["**/node_modules", "**/dist", "**/migrations", "**/seeders"],
  },
  ...compat.extends(),
  {
    languageOptions: {
      parser: tsParser,
    },
    files: ["**/*.ts", "**/*.js", "**/*.mjs"],
    rules: {
      indent: ["error", 2],
      semi: ["error", "never"],
      "comma-dangle": ["error", "always-multiline"],
      "eol-last": ["error", "always"],
    },
  },
]
