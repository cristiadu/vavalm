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