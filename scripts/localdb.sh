#!/usr/bin/env sh

# Determine the platform
platform=$(uname)

stop_postgresql() {
    if [ "$platform" = "Darwin" ]; then
        if command -v pg_ctl >/dev/null 2>&1; then
            pg_ctl -D /usr/local/var/postgres stop
        else
            echo "pg_ctl command not found. Skipping PostgreSQL stop."
        fi
    elif [ "$platform" = "Linux" ]; then
        if systemctl is-active --quiet postgresql; then
            sudo service postgresql stop
        else
            echo "PostgreSQL service is not running. Skipping stop."
        fi
    elif echo "$platform" | grep -q "MINGW"; then
        net stop postgresql
    else
        echo "Unsupported platform: $platform"
        exit 1
    fi
}

# Ensure Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon is not running. Please start Docker and try again."
    exit 1
fi

# Restart PostgreSQL
stop_postgresql
docker-compose up -d db || docker compose up -d db
