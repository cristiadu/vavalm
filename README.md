# VaValM - Valorant Manager

VaValM is a Valorant e-sports manager simulation game where you can manage teams, players, and tournaments in the Valorant competitive scene.

[![Build Project](https://github.com/cristiadu/vavalm/actions/workflows/build.yml/badge.svg)](https://github.com/cristiadu/vavalm/actions/workflows/build.yml)

## Project Structure

This is a monorepo project with the following main components:

- **API**: Backend service built with Express.js and TypeScript
- **UI**: Frontend application built with Next.js and React

## Technology Stack

### Backend (API)

- ExpressJS
- TypeScript
- Sequelize ORM
- PostgreSQL
- tsoa for OpenAPI/Swagger generation
- Webpack & Babel for build process

### Frontend (UI)

- Next.js 16+
- React 19
- TypeScript
- TailwindCSS 4
- React Quill for rich text editing

### Infrastructure

- **Database:** PostgreSQL
- **Container:** Docker & Docker Compose
- **Formatting/Linting:** ESLint
- **Package Management:** pnpm & Workspaces
- **Build Orchestration:** Turborepo

## Prerequisites

1. Node 22.X+ and PNPM
    - See: <https://nodejs.org/en/download/package-manager>
    - Run: `npm install -g pnpm`
2. PostgreSQL
    - See: <https://medium.com/@dan.chiniara/installing-postgresql-for-windows-7ec8145698e3>
3. Docker
    - See: <https://docs.docker.com/engine/install/>
4. Docker Compose
    - See: <https://docs.docker.com/compose/install/linux/>
5. Give execution permissions for scripts:

```bash
chmod +x ./scripts/*.sh
```

## Development Setup

1. Install dependencies:
```bash
pnpm clean install
```

2. Start the local database:
```bash
pnpm localdb dev
```

3. The application will be available at:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8000](http://localhost:8000)
   - API Documentation: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

## Available Scripts

- `pnpm dev` - Run both API and UI in development mode
- `pnpm build` - Build both API and UI for production
- `pnpm start` - Start both API and UI in production mode
- `pnpm test` - Run tests for all packages
- `pnpm test:coverage` - Run tests with coverage reports
- `pnpm lint` - Run linting for all packages
- `pnpm lint:fix` - Run linting and fix issues
- `pnpm migrate` - Run database migrations
- `pnpm localdb` - Manage local database (use with `dev` or `down` arguments)
- `pnpm generate:routes` - Generate API routes using tsoa
- `pnpm generate:spec` - Generate OpenAPI specification
- `pnpm generate:client` - Regenerate TypeScript clients from OpenAPI spec (run after schema changes)

## Game Simulation

VaValM simulates Valorant matches using player **attributes** and **roles** to determine outcomes probabilistically.

### Player Roles

| Role | Combat style |
|------|-------------|
| **Duelist** | Strongest individual duelist; highest duel and trade win buff (+30%/+40%) |
| **Initiator** | Entry fragger; high duel win buff (+25%) and select buff (+40%) |
| **Flex** | Versatile all-rounder; strong trade fighter (+35% trade win buff) |
| **Controller** | Support-oriented; low duel buff but contributes via strategy attributes |
| **Sentinel** | Defensive specialist; focuses on awareness and positioning |
| **IGL** | Leader role; no individual duel buff — contributes through team strategy |

### Player Attributes (16, range 0–3)

Attributes are grouped into five clusters, each with an attack attribute and its counter:

- **Combat**: `aim` ↔ `positioning`, `clutch` ↔ `awareness`, `game_reading` ↔ `aim`
- **Mental**: `resilience` ↔ `confidence`, `confidence` ↔ `game_sense`, `decision_making` ↔ `resilience`
- **Strategic**: `strategy` ↔ `adaptability`, `adaptability` ↔ `strategy`
- **Team**: `communication` ↔ `unpredictability`, `teamwork` ↔ `communication`, `utility_usage` ↔ `teamwork`
- **Wildcard**: `rage_fuel` (counters itself — double-edged)

### Duel & Round Flow

1. Two players are selected for a duel (role-weighted random selection)
2. Win chances = sum of `max(0, attacker_attribute − opponent_counter)` across all 16 attributes
3. Role buffs multiply the win chances (e.g. Duelist gets ×1.30 in normal duels)
4. Winner is drawn randomly proportional to the two players' final win-chance scores
5. A **trade** may trigger after each kill (10% base + role buff) — the winner fights again immediately
6. A **round** ends when one team is fully eliminated; 13 round wins (or +2 in overtime) wins the map
7. **Match formats**: BO1, BO3, BO5 — the team winning the majority of maps wins the match

## Docker Deployment

You can deploy the entire stack using Docker Compose:

```bash
# Build the containers
pnpm dev:docker:build

# Start the containers
pnpm dev:docker:up

# Stop and remove the containers
pnpm dev:docker:down
```

## Project Documentation

- [API Documentation](./api/README.md)
- [UI Documentation](./ui/README.md)
- [Agent Guide](./agent.md)
