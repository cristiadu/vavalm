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
- **CacheService** (`api/src/services/CacheService.ts`) — in-memory TTL cache used by GameService. The stats endpoints do not use it: they read live (see Stats computation).
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
pnpm dev:docker:up    # start the Docker stack (db + api + ui)
pnpm test             # run the test suites against a running stack
pnpm dev:docker:down  # stop the stack
pnpm build            # production build for both api and ui
```

API docs available at `http://localhost:8000/api/docs` when the server is running.

### Verifying a change

A change is not verified until all three pass — they catch different things, and none of
them substitutes for another:

```bash
pnpm lint                                   # style and unused code
pnpm build                                  # type errors, including the ui's
pnpm dev:docker:up && pnpm test             # behaviour, against a real database
pnpm dev:docker:down
```

- **`pnpm lint` is not a type check.** ESLint leaves type errors to the compiler, so a ui
  change can lint clean and still fail to build — `pnpm build` is what type-checks the ui.
- **`pnpm test` needs a running stack.** It no longer starts or stops Docker itself, so bring
  the stack up first; leaving it up between runs is the point.
- **Run these through the pnpm scripts.** Do not substitute `docker`, `vitest`, `tsc` or
  `psql` invocations of your own — if a script fails in your environment, say so rather than
  working around it, because a parallel setup diverges from what CI actually runs.

### Environment Prerequisite

- Before running `pnpm dev`, `pnpm test`, migrations, or any API/UI task, always verify both `api/.env` and `ui/.env` exist.
- If either file is missing, create it from the matching template (`api/.env.template` → `api/.env`, `ui/.env.template` → `ui/.env`) before continuing.

## Key Patterns

- **Stats computation** lives in `PlayerStatsService` and `TeamStatsService`, one per entity. Each computes totals in a single `GROUP BY` query — the same query serves the leaderboard and one entity, so `/players/stats` and `/players/{id}/stats` can never disagree. Nothing is cached: the query is cheap and a cache only added staleness. `PlayerService` and `TeamService` keep just the VLR upsert helpers.
- **Game simulation**: `POST /games/{id}/play` plays an entire game; `POST /games/{id}/rounds/{n}/play` plays one round; `POST /games/{id}/rounds/{n}/duel` plays one duel.
- **Player/team data embedded in responses**: `GameLogApiModel` includes `team1_player` and `team2_player`; `AllPlayerStats` includes `team`; `TeamApiModel` includes `players`. Avoid making separate API calls for data already included.
- **Images are referenced, not embedded**: `TeamApiModel` carries `logo_url`, not the image. Bytes come from `GET /teams/{id}/logo` and are uploaded with multipart to `POST /teams/{id}/logo`. Never inline a blob as base64 into a response — a team's logo was ~26KB of every 27KB stats row.
- **Pagination**: all list endpoints accept `limit` and `offset` query params.
- **Controllers are thin**: no business logic in controllers — only request parsing, calling a service method, and returning the response. All logic lives in services.
- **Cascade deletes**: defined via `onDelete: 'CASCADE'` in Sequelize associations (see `api/src/models/Tournament.ts`). Adding new FKs should include cascade rules so service-layer delete methods stay simple.

## Model & Contract Layer Conventions

Every persisted domain object has two representations that mirror each other:

| Layer | Location | Naming | Base |
|---|---|---|---|
| **DB model** | `api/src/models/` | `Team`, `Player`, `GameLog` … | `Model` (Sequelize) + `BaseEntityModel` |
| **Contract model** | `api/src/models/contract/` | `TeamApiModel`, `PlayerApiModel`, `GameLogApiModel` … | `BaseEntityModel` |

### Required methods

**DB model class** must implement:
- `toApiModel(): *ApiModel` — converts the Sequelize instance to the contract shape.

**Contract model class** (`*ApiModel`) must implement:
- `toApiModel(): *ApiModel` — returns `this` (already in API shape).
- `toEntityModel(): EntityModel | Promise<EntityModel>` — hydrates the contract data back into the DB model type. Never use `Object.assign` or `Object.create`; always call the constructor explicitly.
- `toEntityModelBulk(): Promise<Record<string, unknown>>` — same as `toEntityModel` but returns a plain object suitable for Sequelize `bulkCreate`.

### Plain objects must go through `static from()` — use it everywhere

Two situations produce plain objects that look like `*ApiModel` but have no prototype methods:

1. **tsoa request bodies** — `bodyCoercion: true` validates and coerces fields but never calls `new *ApiModel(...)`.
2. **`DataTypes.JSON` columns** — Sequelize deserializes JSON column values as plain `{}` objects.

Every `*ApiModel` class exposes a **`static from(data): *ApiModel`** factory. Always call it before invoking any method:

```typescript
// tsoa request body
requestBody.map(p => PlayerApiModel.from(p).toEntityModelBulk())

// DB JSON column
RoundStateApiModel.from(this.round_state)
```

`from()` is also responsible for hydrating nested `*ApiModel` fields (e.g. `PlayerApiModel.from()` calls `PlayerAttributesApiModel.from()` so that `this.player_attributes.toEntityModel()` works inside `toEntityModel()`).

Never use `Pick<*ApiModel, ...>` casts inline in `toApiModel()` or controllers — that logic belongs inside `static from()`.

### Naming rules

- DB models: `PascalCase` noun — `Player`, `GameLog`, `Tournament`.
- Contract models: same name suffixed with `ApiModel` — `PlayerApiModel`, `GameLogApiModel`.
- Sub-shapes that appear inside a contract model also follow `*ApiModel` — e.g. `RoundStateApiModel`, `PlayerAttributesApiModel`.
- Never invent a parallel alias (`RoundStateJson`, `RoundStatePlain`, etc.). Use the existing `*ApiModel` and its `static from()` factory.

### JSON column pattern

When a `DataTypes.JSON` column stores a complex object, declare the field with the entity type (e.g. `declare round_state: RoundState`). In `toApiModel()`, convert it via `static from()` on the matching contract model — the factory handles the plain-object-to-instance conversion:

```typescript
return new GameLogApiModel(
  RoundStateApiModel.from(this.round_state),
  ...
)
```

## Code Rules

> **Never use `any`, `unknown`, or `never` as a type in this codebase.** Use the correct domain type or a named type alias. For plain objects from JSON columns or tsoa bodies, use `static from()` on the matching `*ApiModel`.

> **Never use `Object.assign` or `Object.create` to hydrate API models.** Use the constructor directly.

> **Always use `pnpm` scripts — never invoke `docker` or `docker compose` commands directly.** All Docker lifecycle operations are wrapped by pnpm scripts. Examples: `pnpm localdb dev`, `pnpm localdb down`, `pnpm test`, `pnpm dev:docker:up`, `pnpm dev:docker:down`.

> **Every exported function and method must have a JSDoc comment.** Include at minimum a one-line description; add `@param` / `@returns` for non-obvious signatures.

> **Always use path aliases — never use relative imports.** `api/tsconfig.json` defines `@/*` → `src/*` and `@tests/*` → `tests/*`. All imports in `api/src/` use `@/…` and all imports in `api/tests/` use `@tests/…`.

## Testing

Tests live in `api/tests/api/` and use **Vitest** against a real Docker PostgreSQL instance.

### GWT structure

Follow the **Given / When / Then** split:

- **GIVEN** — fixture setup lives in `beforeAll` / `afterAll`, calling helpers from `common-*.ts`.
- **WHEN** — the actual API call being tested, written inline in the `it()` body.
- **THEN** — assertions written inline in the `it()` body. Complex or reusable assertions can be extracted to a helper; if the helper is used in multiple test files, put it in `common-*.ts`.

```typescript
import { apiClient } from '@tests/setup'
import { givenTeamExists, cleanupTeam } from '@tests/api/common-teams'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Teams', () => {
  let teamId: number
  beforeAll(async () => { teamId = await givenTeamExists() })  // GIVEN
  afterAll(async () => { await cleanupTeam(teamId) })

  it('returns the team by id', async () => {
    const result = await apiClient.teams.getTeam(teamId)       // WHEN
    expect(result.id).toBe(teamId)                             // THEN
  })
})
```

### Writing tests that survive a parallel run

Test files run in parallel against one database, and the scheduler is running,
so a test must not assume it is alone:

- **Future-date fixture tournaments.** `TEST_TOURNAMENT` is dated in 2100 so the
  scheduler never treats its matches as due. Only the scheduler suite dates
  fixtures in the past, deliberately, for the matches it wants picked up.
- **Do not compare two reads of a list.** Other suites create and delete rows
  between them. Assert the property that has to hold — a page keeps the
  leaderboard's relative order — rather than exact identity against a snapshot.
- **Bound rate assertions by sampling error.** Simulation is random; use
  `rateLowerBound` rather than a hardcoded threshold, or the test fails on noise.

### `common-*.ts` files

Shared fixture helpers (`givenXExists`, `cleanupX`, shared constants) live in `api/tests/api/common-*.ts`. Rules:

- Every exported function **must have a JSDoc comment** explaining what it sets up or tears down.
- Functions are named `givenXExists` / `cleanupX` to make the Given/Then intent clear at the call site.
- Complex assertion helpers reused across test files also go here.

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

Each player has 16 numeric attributes (range 0–3). Each attribute has a counter attribute on the opponent. Win chance per attribute = `max(0, my_attribute − opponent_counter)`:

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

All 16 attribute contributions are summed to produce a raw win-chance score per player.

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

## Background Match Scheduler

The scheduler automatically plays matches when their scheduled date/time is reached. It runs as a Node.js worker thread, separate from the Express request cycle.

### Architecture

```
SchedulerService (main thread)
  └── scheduleMatchesToPlayWorker (worker thread)
        └── sends create_worker messages → SchedulerService
              └── MatchWorkerService (main thread)
                    └── playScheduledMatchWorker (worker thread, one per match)
                          └── MatchService.playFullMatch(matchId)
```

### Flow

1. **`SchedulerService.startScheduler()`** — spawns `scheduleMatchesToPlayWorker` and sends it a `START` message.
2. Every 60 seconds (or 120 s under stress) the scheduler worker calls `MatchService.getMatchesToBePlayed(now)`:
   - Query: `date <= now AND started = false`, ordered by `date ASC` across all tournaments, limit `MAX_CONCURRENT_MATCHES` (20).
3. For each fetched match it **marks `started = true`** (to prevent duplicate processing) then sends a `create_worker` message to the parent.
4. **`MatchWorkerService.createMatchWorker`** (max `MAX_CONCURRENT_MATCHES` concurrent) spawns a `playScheduledMatchWorker` for the match.
   - If the pool is full **or** spawning fails, `started` is **reverted to `false`** so the match is retried next cycle.
5. **`playScheduledMatchWorker`** calls `MatchService.playFullMatch(matchId)`, then posts a `MatchCompletedMessage` (`WorkerMessageType.MATCH_COMPLETED`) to the parent with `success: true` or `success: false`.
   - On `success: false`, `MatchWorkerService` reverts `started = false` so the match is retried.
   - On worker **crash** (`worker.on('error')`), `MatchWorkerService` also reverts `started = false`.
   - On `success: true`, the match has `finished = true` and is excluded from all future queries.

### Message protocol

`playScheduledMatchWorker` → `MatchWorkerService` uses a single typed message: `MatchCompletedMessage` (`api/src/models/SchedulerTypes.ts`). There are no ad-hoc string message types in the play worker path.

### Circuit Breaker

After 5 consecutive errors the scheduler worker pauses for 60 s before resuming. This is local to `scheduleMatchesToPlayWorker` and only affects match fetching, not in-flight workers. If the scheduler thread crashes it is automatically restarted after 5 s.

### Configuration (`api/src/models/constants.ts`)

| Constant | Default | Meaning |
|---|---|---|
| `MAX_CONCURRENT_MATCHES` | 20 | Max matches fetched per cycle and max simultaneous `playScheduledMatchWorker` threads |
| `MATCH_WORKER_POOL_MAX` | 2 | Database connections a match worker may hold. Each worker thread builds its own Sequelize pool, so the main thread's size would otherwise be multiplied by the worker count |
| `STANDARD_CHECK_INTERVAL` | 60 000 ms | Polling interval under normal conditions. Override with `SCHEDULER_CHECK_INTERVAL`; dev and CI set 2 000 ms so tests do not sit through a cycle |
| `REDUCED_CHECK_INTERVAL` | 2× standard | Polling interval when errors are detected |
| `CIRCUIT_BREAKER_THRESHOLD` | 5 | Consecutive errors before pausing |
| `CIRCUIT_BREAKER_RESET_TIME` | 60 000 ms | Pause duration before resuming |

### Relevant files

| File | Role |
|---|---|
| `api/src/services/SchedulerService.ts` | Lifecycle management, message routing |
| `api/src/workers/scheduleMatchesToPlayWorker.ts` | Polling loop, circuit breaker |
| `api/src/services/MatchWorkerService.ts` | Worker pool, `started` revert on error |
| `api/src/workers/playScheduledMatchWorker.ts` | Executes a single match |
| `api/src/services/MatchService.ts` | `getMatchesToBePlayed`, `playFullMatch`, `updateMatchStatus` |

### Enabling the scheduler

Set `START_SCHEDULER=true` in the API environment. See `api/src/index.ts` for the conditional startup.

## Git / PR Conventions

- **Commit format**: conventional commits with scope — `fix(api): ...`, `perf(ui): ...`, `feat(api): ...`
- **PR title**: same conventional commit format with scope
- **PR description**: always include the *why* (motivation, root cause, impact)
- **No co-author lines** in commits
