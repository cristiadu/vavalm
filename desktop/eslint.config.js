import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import tseslint from 'typescript-eslint'
import nodePlugin from 'eslint-plugin-n'

const typescriptRules = {
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-restricted-types': ['error', {
    types: {
      never: 'Use the concrete domain type instead of never.',
      unknown: 'Use the concrete domain type instead of unknown.',
    },
  }],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'comma-dangle': ['error', 'always-multiline'],
  'func-style': ['error', 'expression', { allowArrowFunctions: true }],
  indent: ['error', 2],
  'no-console': ['error', { allow: ['error', 'info', 'warn'] }],
  'no-var': 'error',
  'prefer-arrow-callback': 'error',
  'prefer-const': 'error',
  semi: ['error', 'never'],
}

export default defineConfig([
  { ignores: ['dist/**', 'node_modules/**', 'release/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.ts'],
    plugins: {
      jsdoc: jsdocPlugin,
      n: nodePlugin,
    },
    rules: typescriptRules,
  },
  {
    files: ['scripts/**/*.ts', 'src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': ['error', {
        contexts: ['VariableDeclarator > ArrowFunctionExpression'],
        require: {
          ArrowFunctionExpression: false,
          ClassDeclaration: false,
          ClassExpression: false,
          FunctionDeclaration: false,
          FunctionExpression: false,
          MethodDefinition: false,
        },
      }],
      'no-restricted-syntax': [
        'error',
        {
          message: 'Prefer async/await over Promise method chains.',
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(catch|finally|then)$/]",
        },
        {
          message: 'Use named exports in application and test code.',
          selector: 'ExportDefaultDeclaration',
        },
      ],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      ...typescriptRules,
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
])
