# VaValM API

This is the backend service for VaValM (Valorant Manager), a Valorant e-sports manager game.

## Tech Stack

- ExpressJS
- TypeScript
- Sequelize ORM
- PostgreSQL
- tsoa for OpenAPI/Swagger generation
- Webpack & Babel for build process

## Development

### Prerequisites

- Node.js 22.x+ and pnpm
- PostgreSQL
- Docker & Docker Compose (for containerized development)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create environment file:
```bash
pnpm create-env-file
```

3. Start development server:
```bash
pnpm dev
```

This will run Webpack in watch mode and start the server using nodemon.

### API Documentation

API documentation is automatically generated using tsoa and can be accessed at:
- `/api/docs` - Swagger UI

### Database

The API uses Sequelize ORM with PostgreSQL. To run migrations:

```bash
pnpm migrate
```

### Testing

```bash
pnpm test
```

For coverage reports:
```bash
pnpm test:coverage
```

### Building for Production

```bash
pnpm build
```

### Docker

A Dockerfile is provided for containerized deployment. You can build the image using:

```bash
docker build -t vavalm-api .
```

## Background Match Scheduler

The scheduler automatically plays matches when their scheduled date/time is reached. Enable it by setting `START_SCHEDULER=true` in the API environment.

### How it works

1. `SchedulerService` spawns a `scheduleMatchesToPlayWorker` thread on startup.
2. Every 60 s the worker queries for unstarted matches where `date <= now`, ordered by `date ASC` across all tournaments (up to 20 at a time).
3. Each match is marked `started = true` immediately to prevent duplicate processing.
4. A `create_worker` message is sent to the parent thread, which asks `MatchWorkerService` to spawn a `playScheduledMatchWorker` (max `MAX_CONCURRENT_MATCHES` concurrent).
   - If the pool is full, `started` is reverted to `false` and the match is retried next cycle.
5. `playScheduledMatchWorker` calls `MatchService.playFullMatch`, then posts a typed `MatchCompletedMessage` (`WorkerMessageType.MATCH_COMPLETED`) to the parent with `success: true/false`.
   - On `success: false` or an uncaught worker crash, `MatchWorkerService` reverts `started = false` so the match is retried.
   - On `success: true`, the match has `finished = true` and leaves the query results permanently.

A circuit breaker in `scheduleMatchesToPlayWorker` pauses match fetching for 60 s after 5 consecutive errors. The scheduler thread auto-restarts after crashes (5 s delay).

Configuration constants are in `src/models/constants.ts`.

## Project Structure

- `/src/base` - Core application components
- `/src/bootstrap` - Application bootstrap and setup
- `/src/config` - Configuration files
- `/src/controllers` - API controllers (endpoints)
- `/src/middleware` - Express middleware
- `/src/models` - Sequelize models
- `/src/routes` - API routes
- `/src/services` - Business logic services
- `/src/workers` - Background workers
- `/docs` - Generated API documentation
- `/tests` - Test files 