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

> **Rule: always use `pnpm` scripts — never invoke `docker` or `docker compose` commands directly.** All Docker lifecycle operations (database, containers, test environment) are wrapped by pnpm scripts defined in `package.json`. Examples: `pnpm localdb dev`, `pnpm localdb down`, `pnpm test`, `pnpm dev:docker:up`, `pnpm dev:docker:down`. Using raw `docker` commands bypasses these wrappers and may leave the environment in an inconsistent state.

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

## Game Mechanics

### Player Roles

Each player has a role that determines their probability weights during duels. Roles affect four buffs:

| Role | Duel win buff | Trade win buff | Duel select buff | Trade select buff |
|------|:---:|:---:|:---:|:---:|
| **Duelist** | +30% | +40% | +40% | +40% |
| **Initiator** | +25% | +20% | +40% | +20% |
| **Flex** | +15% | +35% | +15% | +35% |
| **Controller** | +5% | +15% | +5% | +15% |
| **Sentinel** | +5% | +20% | +5% | +20% |
| **IGL** | 0% | +10% | +5% | +15% |

- **Duel win/select buff** — applied to regular (non-trade) duels
- **Trade win/select buff** — applied when a trade duel is triggered (see below)

### Player Attributes

Each player has 16 numeric attributes (range 0–3). They are paired as *attack vs counter* in duel calculations:

| Attribute | Countered by |
|---|---|
| `clutch` | `awareness` |
| `awareness` | `game_reading` |
| `game_reading` | `aim` |
| `aim` | `positioning` |
| `positioning` | `clutch` |
| `resilience` | `confidence` |
| `confidence` | `game_sense` |
| `game_sense` | `decision_making` |
| `decision_making` | `resilience` |
| `strategy` | `adaptability` |
| `adaptability` | `strategy` |
| `communication` | `unpredictability` |
| `unpredictability` | `utility_usage` |
| `utility_usage` | `teamwork` |
| `teamwork` | `communication` |
| `rage_fuel` | `rage_fuel` (self-counter) |

For each attribute, a player's contribution is `max(0, my_attribute - opponent_counter_attribute)`. All contributions are summed to produce a raw win-chance score per player.

### Duel Mechanics

A single duel proceeds as follows:

1. **Player selection** — Each alive player is duplicated in a weighted array by their select buff (`getDuelSelectBuffByPlayerRole` for regular, `getTradeSelectBuffByPlayerRole` for trades). A random index picks the duelling players.
2. **Win-chance calculation** — Sum all attribute contributions for each player (attribute vs counter), then multiply by `1 + duel_win_buff` (or `1 + trade_win_buff` during a trade). Both values are floored to ≥ 1.
3. **Winner draw** — A random integer in `[0, chancesPlayer1 + chancesPlayer2)` is drawn. Values `< chancesPlayer1` give the win to player 1.
4. **Loser removed** — The losing player is removed from that team's alive list.
5. **Trade check** — Base trade chance is 10%. If the winner's `getTradeSelectBuffByPlayerRole` pushes it above 10%, the next duel is a *trade duel* (the round winner must fight again first). Trade duels use trade buffs instead of duel buffs.

### Round & Game Scoring

- A **round** is a series of duels (5v5) until one team has 0 players alive. The surviving team wins the round.
- A **game** (map) is won by the first team to reach 13 round wins. After 12-12 a team must lead by 2.
- A **match** is BO1, BO3, or BO5 — the team winning the majority of games wins the match.
- Stats tracked per game log: `kills`, `deaths`, `assists`. KDA = `(kills + assists) / deaths` (0 when deaths = 0). Winrate = `matchesWon / matchesPlayed × 100`.

## Git / PR Conventions

- **Commit format**: conventional commits with scope — `fix(api): ...`, `perf(ui): ...`, `feat(api): ...`
- **PR title**: same conventional commit format with scope
- **PR description**: always include the *why* (motivation, root cause, impact)
- **No co-author lines** in commits
