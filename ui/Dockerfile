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
COPY tailwind.config.js /app
COPY postcss.config.js /app

# build the application
RUN npm run build

# Use another container to run the application
FROM node:lts AS runner

# set the working directory
WORKDIR /app

ENV PORT=3000

# copy built files
COPY --from=builder /app/.next /app/.next

# copy package.json and package-lock.json
COPY package*.json /app
COPY next.config.js /app
COPY next-env.d.ts /app

# install the dependencies
RUN npm install

EXPOSE $PORT

# start the application
CMD ["npm", "run", "start"]
