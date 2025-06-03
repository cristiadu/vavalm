import type { KnipConfig } from 'knip'

// Knip configuration for monorepo with Next.js, React Router v7, and shared packages
const config = {
  tags: ['knipignore'],
  workspaces: {
    'api': {
      project: ['**/*.{ts,js}'],
      entry: ['src/index.ts', 'src/workers/*.{ts,js}'],
    },
    'ui': {
      project: ['**/*.{ts,js,tsx,jsx}'],
      ignore: ['./app/components/games/GameDetails.tsx'],
    },
    '.': {
      project: ['scripts/*.{ts,js}'],
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