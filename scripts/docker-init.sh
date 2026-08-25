#!/bin/bash
set -e

# Check if containers are already running — skip rebuild for speed
CONTAINERS=$(docker compose ps -q 2>/dev/null)

if [ -n "$CONTAINERS" ]; then
  echo "Containers already running."
  exit 0
fi

# Build images if missing or outdated, then start and wait for health checks
echo "Starting containers (building if needed)..."
docker compose up -d --wait --build
