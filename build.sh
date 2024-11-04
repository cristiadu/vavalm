#!/bin/sh

# Build the Docker images without using the cache
docker-compose build --no-cache --progress=plain

# Start the services
docker-compose up