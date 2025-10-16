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

- Next.js 15+
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
