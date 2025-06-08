import type { KnipConfig } from 'knip'

// Knip configuration for monorepo with Next.js, React Router v7, and shared packages
const config = {
  tags: ['knipignore'],
  workspaces: {
    'api': {
      project: ['src/**/*.{ts,js}', 'tests/**/*.{ts,js,tsx,jsx}'],
      entry: ['src/workers/*.{ts,js}'],
      ignoreDependencies: ['pg'],
    },
    'ui': {
      project: ['**/*.{ts,js,tsx,jsx}'],
      ignore: ['./app/components/games/GameDetails.tsx'],
    },
  },
  ignore: [
    '**/public/**',
    '**/dist/**',
    '**/.next/**',
    '**/node_modules/**',
    '**/.turbo/**',
  ],
} as const satisfies KnipConfig

export default config