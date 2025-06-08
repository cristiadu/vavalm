# VaValM UI

This is the frontend application for VaValM (Valorant Manager), a Valorant e-sports manager game.

## Tech Stack

- Next.js 15+
- React 19
- TypeScript
- TailwindCSS 4
- React Quill for rich text editing

## Development

### Prerequisites

- Node.js 22.x+ and pnpm
- API server running (for full functionality)

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

This will start the Next.js development server on port 3000.

### Building for Production

```bash
pnpm build
```

To run the production build locally:
```bash
pnpm start
```

### Docker

A Dockerfile is provided for containerized deployment. You can build the image using:

```bash
docker build -t vavalm-ui .
```

## Project Structure

- `/app` - Next.js app directory
  - `/api` - API client and models
  - `/common` - Shared components and utilities
  - `/components` - React components
  - `/players` - Player-related pages
  - `/teams` - Team-related pages
  - `/tournaments` - Tournament-related pages
- `/public` - Static assets

## API Integration

The UI consumes the VaValM API through a generated TypeScript client. The client is automatically generated during the postinstall process using the OpenAPI specification from the API project.

To manually regenerate the API client:
```bash
pnpm generate:client
``` 