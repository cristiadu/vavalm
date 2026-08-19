FROM node:lts AS builder

# set the working directory
WORKDIR /app

# The build context is the repository root, so the workspace lockfile and the
# api's openapi spec are both reachable with a plain `docker build`. A named
# context reaches them too, but only under Compose/Buildx.
COPY ui/ /app/
COPY api/docs/openapi.yaml /api/docs/openapi.yaml
COPY pnpm-lock.yaml /app/pnpm-lock.yaml
# workspace config carries pnpm policies (e.g. allowBuilds) needed by pnpm install
COPY pnpm-workspace.yaml /app/pnpm-workspace.yaml

# install the dependencies
# pin pnpm to the workspace's packageManager version (see root package.json)
RUN npm install -g pnpm@11.9.0
RUN pnpm install

# build the application, opting in to next's traced server output — this is the
# only build that wants it, so the setting lives here rather than in the config
RUN NEXT_OUTPUT_STANDALONE=true pnpm build

# Verify the standalone server exists
RUN ls -la .next/standalone

# Use another container to run the application
FROM node:lts-alpine AS runner

# set the working directory
WORKDIR /app

ENV PORT=3000
ENV NODE_ENV=production
# next's standalone server binds to HOSTNAME, and docker sets that to the
# container id — so it would listen on the container's own name and nothing
# inside the container could reach it. Binding ipv4 explicitly means the
# healthcheck must use 127.0.0.1: `localhost` resolves to ::1 first, which
# nothing is listening on.
ENV HOSTNAME=0.0.0.0

# next build --standalone traces the modules the server actually loads, so this
# carries a fraction of the install rather than the whole toolchain. Static
# assets and public/ are not traced and are copied alongside it.
COPY --from=builder /app/.next/standalone /app/
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:$PORT || exit 1

# Run the traced server directly. `pnpm start` would verify dependencies against
# the lockfile on every boot and re-run an install the image has no need for —
# the same failure that took the api down on its host.
CMD ["node", "server.js"]
