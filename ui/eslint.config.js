import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import js from '@eslint/js';

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      
      // Style rules
      "indent": ["error", 2],
      "semi": ["error", "never"],
      "comma-dangle": ["error", "always-multiline"]
    }
  },
  {
    ignores: [
      "node_modules/**", 
      ".next/**", 
      "out/**", 
      "dist/**", 
      "*.config.js",
      "next-env.d.ts"
    ]
  }
]);