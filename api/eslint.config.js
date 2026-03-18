import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nodePlugin from "eslint-plugin-n";

const nodeRules = {
  "n/no-callback-literal": "error",
  "n/no-extraneous-import": "error",
  "n/no-new-require": "error",
  "n/no-process-exit": "error",
  "n/no-unpublished-bin": "error",
  "n/process-exit-as-throw": "error",
  "n/shebang": "error",
  "no-console": "off" // Allow console for server-side logging
}

const tsRules = {
        // TypeScript specific rules
        "@typescript-eslint/no-explicit-any": "error", // Discourage use of 'any' type
        "@typescript-eslint/explicit-function-return-type": "error", // Require return types on functions
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }], // Allow unused vars with underscore
}

// Test-specific rules - more relaxed
const testRules = {
  "@typescript-eslint/no-explicit-any": "warn", // Allow 'any' type in tests but warn
  "n/no-unpublished-import": "off", // Allow importing test libraries
  "@typescript-eslint/explicit-function-return-type": "off", // Don't require return types in tests
}

export default defineConfig([
  { ignores: ["dist/**", "node_modules/**", "./**/generated/**"] },
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
      n: nodePlugin
    },
    rules: {
      ...nodeRules,
    }
  },
  {
    files: ["**/*.ts"],
    plugins: {
      n: nodePlugin
    },
    rules: {
      ...nodeRules,
      ...tsRules,
      // Style rules
      "indent": ["error", 2],
      "semi": ["error", "never"],
      "comma-dangle": ["error", "always-multiline"]
    }
  },
  // Special rules for test files
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly"
      }
    },
    plugins: {
      n: nodePlugin
    },
    rules: {
      ...nodeRules,
      ...tsRules,
      ...testRules,
      // Style rules
      "indent": ["error", 2],
      "semi": ["error", "never"],
      "comma-dangle": ["error", "always-multiline"]
    }
  }
]);
