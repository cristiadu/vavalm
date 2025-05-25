FROM node:lts AS builder

# set the working directory
WORKDIR /app

# Copy all files but adjust to have pnpm-lock properly with workspace.
COPY ./ /app
COPY ./src /app/src
COPY ./docs /app/docs
COPY --from=parent_dir ./pnpm-lock.yaml /app/pnpm-lock.yaml

# install the dependencies
RUN npm install -g pnpm
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
COPY --from=parent_dir ./pnpm-lock.yaml /app/pnpm-lock.yaml

# install pnpm globally
RUN npm install -g pnpm

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Use non-root user
USER nodejs

EXPOSE $PORT

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:$PORT/health || exit 1

# start the application with the original start script
# the bundle.js should already exist, so wait-on should pass immediately
CMD ["pnpm", "start"]
