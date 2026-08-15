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

# copy built files and node_modules
# webpack marks pg, express and sequelize as externals, so the bundle alone is
# not enough to boot — node_modules ships with it.
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/docs/openapi.yaml /app/docs/openapi.yaml
COPY --from=builder /app/node_modules /app/node_modules

# copy config files root api folder.
COPY api/package.json /app/package.json
# use the builder's lockfile/workspace config so they match the installed node_modules
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml

# install pnpm globally, pinned to the workspace's packageManager version
RUN npm install -g pnpm@11.9.0

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

# start the application with the original start script
# the bundle.js should already exist, so wait-on should pass immediately
CMD ["pnpm", "start"]
