#!/bin/bash

# Check if any containers for this project are running
CONTAINERS=$(docker compose ps -q)

if [ -z "$CONTAINERS" ]; then
  # No containers found, check if the images exist by trying to inspect them
  if ! docker compose config --images > /dev/null 2>&1; then
    # Images not found, need to build
    echo "No containers running and images may not exist. Building..."
    docker compose build
  else
    echo "Images may exist but no containers running. Starting containers."
  fi
  
  # Start containers
  echo "Starting containers..."
  docker compose up -d
else
  echo "Containers already running."
fi
