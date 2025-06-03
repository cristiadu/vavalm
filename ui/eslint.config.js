import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      '@next/next': nextPlugin
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      
      // Next.js specific rules
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
      
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
      "next-env.d.ts",
      "./**/generated/**"
    ]
  }
]);