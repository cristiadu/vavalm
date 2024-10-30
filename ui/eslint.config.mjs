import path from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"
import { includeIgnoreFile } from "@eslint/compat"
import tsParser from "@typescript-eslint/parser"
import js from "@eslint/js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, "../.gitignore")

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const eslintConfig = [
  includeIgnoreFile(gitignorePath),
  ...compat.extends("next", "next/core-web-vitals"),
  {
    languageOptions: {
      parser: tsParser,
    },
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs"],
    rules: {
      indent: ["error", 2],
      semi: ["error", "never"],
      "comma-dangle": ["error", "always-multiline"],
    },
  },
]

export default eslintConfig