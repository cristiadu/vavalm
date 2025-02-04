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

1. Node 20.X+
    - See: <https://nodejs.org/en/download/package-manager>
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
npm run clean && npm install
npm run localdb && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser.

Note: Ensure that the default setup for CodeQL analysis is disabled to avoid conflicts with the advanced configuration.

## CodeQL Setup and Configuration

To resolve the CodeQL SARIF file processing error, ensure that the `codeql.yml` workflow file is correctly configured. Here are the correct settings for `languages` and `build-mode` fields in the `initialize CodeQL` step:

* `languages`: `javascript-typescript`
* `build-mode`: `none`

Ensure that only the advanced configuration is enabled and the default setup is disabled. Verify that the SARIF file being submitted is correctly formatted and adheres to the SARIF specification.
