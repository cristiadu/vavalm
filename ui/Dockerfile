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
COPY ./app /app/app
COPY ./public /app/public
COPY next.config.js /app
COPY next-env.d.ts /app
COPY eslint.config.mjs /app
COPY postcss.config.mjs /app
COPY tailwind.config.js /app

# build the application
RUN npm run build

# Use another container to run the application
FROM node:lts AS runner

# set the working directory
WORKDIR /app

ENV PORT=3000
ENV NODE_ENV=production

# copy built files
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

# copy package.json and package-lock.json
COPY package*.json /app
COPY next.config.js /app
COPY next-env.d.ts /app
COPY postcss.config.mjs /app
COPY tailwind.config.js /app

# install production dependencies only
RUN npm ci --only=production

EXPOSE $PORT

# start the application
CMD ["npm", "run", "start"]
