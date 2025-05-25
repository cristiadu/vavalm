#!/bin/sh
docker-compose up --build -d --wait --wait-timeout 30 || docker compose up --build -d --wait --wait-timeout 30
