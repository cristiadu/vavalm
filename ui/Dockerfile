FROM node:lts AS builder

# set the working directory
WORKDIR /app

# Copy all files but adjust to have pnpm-lock properly with workspace.
COPY ./ /app
COPY ./app /app/app
COPY ./public /app/public
COPY --from=parent_dir ./api/docs/openapi.yaml /api/docs/openapi.yaml
COPY --from=parent_dir ./pnpm-lock.yaml /app/pnpm-lock.yaml

# install the dependencies
RUN npm install -g pnpm
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
COPY --from=parent_dir ./pnpm-lock.yaml /app/pnpm-lock.yaml

# install pnpm globally
RUN npm install -g pnpm

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:$PORT || exit 1

# start the application
CMD ["pnpm", "start"]
