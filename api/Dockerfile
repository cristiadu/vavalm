FROM node:lts AS builder

# set the working directory
WORKDIR /app

# copy the package.json and package-lock.json
COPY package*.json /app

COPY tsconfig.json /app
COPY --from=parent_dir ./tsconfig.json /tsconfig.json

# install the dependencies
RUN npm install

# copy the source code
COPY ./src /app/src
COPY webpack.config.js /app
COPY eslint.config.mjs /app
COPY .babelrc /app

# build the application
RUN npm run build

# Use Alpine for smaller image size
FROM node:lts-alpine AS runner

# Set up directory and user for security
WORKDIR /app

# Set environment variables
ENV PORT=8000
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"

# copy built files
COPY --from=builder /app/dist /app/dist

# copy package.json and package-lock.json
COPY package*.json /app
COPY webpack.config.js /app

# install production dependencies only
RUN npm ci --only=production --no-audit --production && \
    npm cache clean --force

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

# start the application with optimized flags
CMD ["node", "--trace-warnings", "dist/bundle.js"]
