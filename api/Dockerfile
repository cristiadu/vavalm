FROM node:lts AS builder

# set the working directory
WORKDIR /app

# Copy all files but adjust to have pnpm-lock properly with workspace.
COPY ./ /app
COPY ./src /app/src
COPY ./docs /app/docs
COPY --from=parent_dir ./pnpm-lock.yaml /app/pnpm-lock.yaml
# workspace config carries pnpm policies (e.g. allowBuilds) needed by pnpm install
COPY --from=parent_dir ./pnpm-workspace.yaml /app/pnpm-workspace.yaml

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
ENV NODE_OPTIONS="--max-old-space-size=4096"

# copy built files and node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/docs/openapi.yaml /app/docs/openapi.yaml
COPY --from=builder /app/node_modules /app/node_modules

# copy config files root api folder.
COPY package.json /app/
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
