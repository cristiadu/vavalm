# VaValM — Agent Guide

VaValM is a **Valorant e-sports tournament management simulator** — not a real game client. It simulates matches round-by-round, tracks stats, and manages tournaments, teams, and players.

## Architecture

Monorepo managed with **pnpm workspaces** and **Turborepo**.

```
/
├── api/        # Express + tsoa + Sequelize + PostgreSQL
└── ui/         # Next.js 16 App Router + TailwindCSS 4
```

### Backend (`api/`)

- **Express 5** with **tsoa** for decorator-based controllers → auto-generated OpenAPI spec and route handlers
- **Sequelize 6** ORM with **PostgreSQL**
- **CacheService** (`api/src/services/CacheService.ts`) — in-memory TTL cache used in GameService, PlayerService, TeamService
- Controllers live in `api/src/controllers/`, services in `api/src/services/`, Sequelize models in `api/src/models/`
- Contract models (API shapes) are separate from DB models: `api/src/models/contract/`

### Frontend (`ui/`)

- **Next.js 16** App Router — all pages are client components (`"use client"`)
- API wrappers in `ui/app/api/*.ts` use a callback/closure pattern: `fetchTeams(callbackFn, limit, offset)`
- Simple TTL caches in `PlayersApi.ts` and `RoundApi.ts`
- UI client is auto-generated from the OpenAPI spec

### Code Generation Pipeline

```
Backend controllers (tsoa decorators)
  → pnpm generate:spec       → api/docs/openapi.yaml
  → pnpm generate:routes     → api/src/routes/ (TSOA route handlers)
  → pnpm generate:client     → api/tests/generated/api/ (test client)
  → ui: pnpm generate:client → ui/app/api/generated/ (UI client)
```

All four steps run automatically via `postinstall` when you run `pnpm install` from the root. After changing any controller/model schema, run `pnpm install` to regenerate everything.

## Development

```bash
pnpm install          # install + regenerate spec, routes, clients
pnpm localdb dev      # start local PostgreSQL via Docker
pnpm dev              # start API (port 8000) + UI (port 3000) with hot reload
pnpm migrate          # run database migrations
pnpm test             # spin up Docker, run tests, tear down
pnpm build            # production build for both api and ui
```

API docs available at `http://localhost:8000/api/docs` when the server is running.

## Key Patterns

- **Stats computation** (`PlayerService`, `TeamService`) fetches all rows and computes stats in memory — results are cached for 2 minutes with `CacheService`. Cache is invalidated when a game or round is played.
- **Game simulation**: `POST /games/{id}/play` plays an entire game; `POST /games/{id}/rounds/{n}/play` plays one round; `POST /games/{id}/rounds/{n}/duel` plays one duel.
- **Player/team data embedded in responses**: `GameLogApiModel` includes `team1_player` and `team2_player`; `AllPlayerStats` includes `team`; `TeamApiModel` includes `players`. Avoid making separate API calls for data already included.
- **Pagination**: all list endpoints accept `limit` and `offset` query params.

## Testing

Tests live in `api/tests/api/` and use **Vitest** against a real Docker PostgreSQL instance. Follow the pattern in `health.test.ts`:

```typescript
import { apiClient } from '@tests/setup'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('...', () => {
  let fixtureId: number
  beforeAll(async () => { /* create via API */ })
  afterAll(async () => { /* delete via API */ })
  it('...', async () => { expect(...) })
})
```

## Git / PR Conventions

- **Commit format**: conventional commits with scope — `fix(api): ...`, `perf(ui): ...`, `feat(api): ...`
- **PR title**: same conventional commit format with scope
- **PR description**: always include the *why* (motivation, root cause, impact)
- **No co-author lines** in commits
