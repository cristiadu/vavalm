FROM node:lts AS builder

# set the working directory
WORKDIR /app

# The build context is the repository root, so the workspace lockfile is
# reachable with a plain `docker build`. A named context (additional_contexts)
# would reach it too, but only under Compose/Buildx — a managed host running
# `docker build` cannot resolve one, and this image has to build in both.
COPY api/ /app/
COPY pnpm-lock.yaml /app/pnpm-lock.yaml
# workspace config carries pnpm policies (e.g. allowBuilds) needed by pnpm install
COPY pnpm-workspace.yaml /app/pnpm-workspace.yaml

# install the dependencies
# pin pnpm to the workspace's packageManager version (see root package.json)
RUN npm install -g pnpm@11.9.0
RUN pnpm clean
RUN pnpm install

# build the application
RUN pnpm build

# Verify the bundle exists
RUN ls -la dist/ && test -f dist/bundle.js

# Runtime dependencies only, resolved separately from the build toolchain.
# The builder's tree carries webpack, vitest, eslint and typescript — none of
# which run in production. Scripts are skipped because the api's postinstall
# generates the spec and routes, which needs sources this stage does not have.
FROM node:lts AS deps

WORKDIR /deps

COPY api/package.json /deps/package.json
COPY pnpm-lock.yaml /deps/pnpm-lock.yaml
COPY pnpm-workspace.yaml /deps/pnpm-workspace.yaml

RUN npm install -g pnpm@11.9.0
RUN pnpm install --prod --ignore-scripts

# Use Alpine for smaller image size
FROM node:lts-alpine AS runner

# Set up directory and user for security
WORKDIR /app

# Set environment variables
ENV PORT=8000
ENV NODE_ENV=production
# The heap cap lives here rather than in the start script so a deployment target
# with less memory than this can lower it by setting NODE_OPTIONS; a
# command-line flag would take precedence over the environment and could not be
# overridden.
ENV NODE_OPTIONS="--max-old-space-size=4096"

# copy built files, and runtime dependencies rather than the builder's tree
# webpack leaves express and sequelize as externals and sequelize loads pg
# dynamically, so the bundle alone is not enough to boot — but only the
# production tree is needed, not the toolchain that produced the bundle.
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/docs/openapi.yaml /app/docs/openapi.yaml
COPY --from=deps /deps/node_modules /app/node_modules

# webpack emits an ES module, so package.json ships for its "type": "module".
# The lockfile and workspace config deliberately do not: pnpm verifies
# node_modules against them before running a script, decides a runtime-only
# tree is out of sync, and re-runs `pnpm install` — which fires the api's
# postinstall and fails on the tsoa config that this stage has no reason to
# carry. Nothing here needs a package manager.
COPY api/package.json /app/package.json

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Use non-root user
USER nodejs

EXPOSE $PORT

# Set healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=10 \
    CMD wget -q -O - http://localhost:$PORT/api/health || exit 1

# Run the bundle directly. `pnpm start` would re-verify dependencies on every
# boot, and its wait-on guard buys nothing here — the build stage already
# proved dist/bundle.js exists. The heap cap comes from NODE_OPTIONS above.
CMD ["node", "dist/bundle.js"]
