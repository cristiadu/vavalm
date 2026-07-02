FROM node:lts AS builder

# set the working directory
WORKDIR /app

# Copy all files but adjust to have pnpm-lock properly with workspace.
COPY ./ /app
COPY ./app /app/app
COPY ./public /app/public
COPY --from=parent_dir ./api/docs/openapi.yaml /api/docs/openapi.yaml
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

# Use another container to run the application
FROM node:lts AS runner

# set the working directory
WORKDIR /app

ENV PORT=3000
ENV NODE_ENV=production

# copy built files
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/node_modules /app/node_modules

# copy config files root ui folder.
COPY package.json /app/package.json
COPY next.config.js /app/next.config.js
# use the builder's lockfile/workspace config so they match the installed node_modules
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml

# install pnpm globally, pinned to the workspace's packageManager version
RUN npm install -g pnpm@11.9.0

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:$PORT || exit 1

# start the application
CMD ["pnpm", "start"]
