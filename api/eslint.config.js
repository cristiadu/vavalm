import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nodePlugin from "eslint-plugin-node";

const nodeRules = {
  "node/no-callback-literal": "error",
  "node/no-extraneous-import": "error",
  "node/no-new-require": "error",
  "node/no-process-exit": "error",
  "node/no-unpublished-bin": "error",
  "node/process-exit-as-throw": "error",
  "node/shebang": "error",
  "no-console": "off" // Allow console for server-side logging
}

const tsRules = {
        // TypeScript specific rules
        "@typescript-eslint/no-explicit-any": "error", // Discourage use of 'any' type
        "@typescript-eslint/explicit-function-return-type": "error", // Require return types on functions
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }], // Allow unused vars with underscore
}

export default defineConfig([
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  { 
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: {
      node: nodePlugin
    },
    rules: {
      ...nodeRules,
    }
  },
  {
    files: ["**/*.ts"],
    plugins: {
      node: nodePlugin
    },
    rules: {
      ...nodeRules,
      ...tsRules,
      // Style rules
      "indent": ["error", 2],
      "semi": ["error", "never"],
      "comma-dangle": ["error", "always-multiline"]
    }
  }
]);