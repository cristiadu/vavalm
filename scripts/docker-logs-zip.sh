#!/bin/sh

set -eu

timestamp=$(date +"%Y%m%d-%H%M%S")
project_name=${COMPOSE_PROJECT_NAME:-$(basename "$PWD")}
artifacts_dir="${PWD}/artifacts"
bundle_name="${project_name}-docker-logs-${timestamp}"
bundle_dir="${artifacts_dir}/${bundle_name}"
archive_path="${artifacts_dir}/${bundle_name}.zip"

mkdir -p "$bundle_dir"

container_ids=$(docker compose ps -aq)

if [ -z "$container_ids" ]; then
  echo "No docker compose containers found for project '${project_name}'." >&2
  exit 1
fi

docker compose ps -a > "${bundle_dir}/compose-ps.txt"
docker compose config > "${bundle_dir}/compose-config.yaml"

for container_id in $container_ids; do
  container_name=$(docker inspect --format '{{.Name}}' "$container_id" | sed 's#^/##')
  docker logs --timestamps "$container_id" > "${bundle_dir}/${container_name}.log" 2>&1 || true
done

(
  cd "$artifacts_dir"
  zip -rq "${archive_path}" "${bundle_name}"
)

rm -rf "$bundle_dir"

echo "${archive_path}"
