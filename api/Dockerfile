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

# Use another container to run the application
FROM node:lts AS runner

# set the working directory
WORKDIR /app

ENV PORT=4000

# copy built files
COPY --from=builder /app/dist /app/dist

# copy package.json and package-lock.json
COPY package*.json /app
COPY webpack.config.js /app

# install the dependencies
RUN npm install

EXPOSE $PORT

# start the application
CMD ["npm", "run", "start"]
