#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.staging}"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/docker-compose.staging.example.yml}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups/staging-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || { echo "ERROR: RETENTION_DAYS must be a non-negative integer." >&2; exit 2; }
"$SCRIPT_DIR/validate-deploy-env.py" "$ENV_FILE"
container="$("${COMPOSE[@]}" ps -q postgres)"
[[ -n "$container" ]] || { echo "ERROR: staging PostgreSQL service is not running." >&2; exit 1; }
[[ "$(docker inspect --format '{{.State.Status}}' "$container")" == "running" ]] || { echo "ERROR: PostgreSQL container is not running." >&2; exit 1; }

umask 077
mkdir -p -- "$BACKUP_DIR"
timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
backup_file="$BACKUP_DIR/docnear-staging-$timestamp.dump"
partial_file="$backup_file.partial"
trap 'rm -f -- "$partial_file"' EXIT

echo "Creating encrypted-transport-local PostgreSQL custom-format dump..."
"${COMPOSE[@]}" exec -T postgres sh -c 'exec pg_dump --format=custom --no-owner --no-acl --dbname="$POSTGRES_DB" --username="$POSTGRES_USER"' >"$partial_file"
[[ -s "$partial_file" ]] || { echo "ERROR: pg_dump produced an empty backup." >&2; exit 1; }
chmod 600 "$partial_file"
mv -- "$partial_file" "$backup_file"
trap - EXIT
echo "Backup created: $backup_file (mode 0600)"
echo "Retention guidance: verify restore regularly, copy backups to encrypted off-host storage, and retain according to policy."
if (( RETENTION_DAYS > 0 )); then
  echo "No files were deleted automatically. To review dumps older than $RETENTION_DAYS days:"
  echo "  find '$BACKUP_DIR' -type f -name 'docnear-staging-*.dump' -mtime +$RETENTION_DAYS -print"
fi

