# VaValM - Valorant Manager

Valorant e-sports manager game which some set of rules I invented in my head.

## Technologies used

### Backend

- ExpressJS
- Typescript
- Sequelize
- Webpack + Babel (Build)

### Frontend

- NextJS
- ReactJS
  - ReactJS Quill
- TailwindCSS
- Typescript

### Infrastructure

- **Database:** PostgreSQL
- **Formatting/Linting**: ESLint

## Pre-requisites

1. Node 22.X+ and PNPM
    - See: <https://nodejs.org/en/download/package-manager>
    - Run: `npm install -g pnpm`
2. PostgreSQL.
    - See: <https://medium.com/@dan.chiniara/installing-postgresql-for-windows-7ec8145698e3>
3. Docker
    - See: <https://docs.docker.com/engine/install/>
4. Docker Compose
    - See: <https://docs.docker.com/compose/install/linux/>
5. Give execution permissions for `/scripts/localdb.sh` file:

```bash
chmod +x ./scripts/localdb.sh
```

## Run Project

```bash
pnpm clean install
pnpm localdb dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser.
