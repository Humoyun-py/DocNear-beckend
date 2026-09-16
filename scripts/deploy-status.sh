#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.staging}"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/docker-compose.staging.example.yml}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

cd "$REPO_ROOT"
echo "Git branch: $(git branch --show-current 2>/dev/null || echo detached)"
echo "Git commit: $(git rev-parse HEAD)"
echo
echo "Docker services:"
if [[ -f "$ENV_FILE" ]] && docker compose version >/dev/null 2>&1; then
  "${COMPOSE[@]}" ps || true
  for service in backend postgres redis; do
    container="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
    if [[ -z "$container" ]]; then
      echo "$service health: not running"
    else
      state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo unknown)"
      echo "$service health: $state"
    fi
  done
else
  echo "Compose status unavailable: Docker Compose or environment file is missing."
fi
echo
echo "Disk usage:"
df -h "$REPO_ROOT"
echo
echo "Memory usage:"
if command -v free >/dev/null 2>&1; then free -h; else awk '/MemTotal|MemAvailable/ {print}' /proc/meminfo; fi

