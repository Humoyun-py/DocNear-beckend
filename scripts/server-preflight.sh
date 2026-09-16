#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${1:-$REPO_ROOT/.env.staging}"
COMPOSE_FILE="${2:-$REPO_ROOT/docker-compose.staging.example.yml}"
MIN_CPU="${MIN_CPU_COUNT:-2}"
MIN_RAM_MB="${MIN_RAM_MB:-2048}"
MIN_DISK_GB="${MIN_DISK_GB:-10}"
failures=0
warnings=0

pass() { printf 'PASS: %s\n' "$1"; }
warn() { printf 'WARN: %s\n' "$1" >&2; warnings=$((warnings + 1)); }
fail() { printf 'FAIL: %s\n' "$1" >&2; failures=$((failures + 1)); }
have() { command -v "$1" >/dev/null 2>&1; }

if [[ "$(uname -s)" == "Linux" ]] && [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  if [[ "${ID:-}" == "ubuntu" && "${VERSION_ID:-}" == "24.04" ]]; then
    pass "Ubuntu 24.04 detected"
  else
    fail "Ubuntu 24.04 required; detected ${PRETTY_NAME:-unknown Linux}"
  fi
else
  fail "supported Linux server not detected"
fi

cpu_count="$(getconf _NPROCESSORS_ONLN 2>/dev/null || printf '0')"
if (( cpu_count >= MIN_CPU )); then pass "CPU count: $cpu_count"; else fail "CPU count $cpu_count is below $MIN_CPU"; fi
ram_mb="$(awk '/^MemTotal:/ {print int($2 / 1024)}' /proc/meminfo 2>/dev/null || printf '0')"
if (( ram_mb >= MIN_RAM_MB )); then pass "RAM: ${ram_mb} MiB"; else fail "RAM ${ram_mb} MiB is below ${MIN_RAM_MB} MiB"; fi
disk_kb="$(df -Pk "$REPO_ROOT" | awk 'NR==2 {print $4}')"
disk_gb=$((disk_kb / 1024 / 1024))
if (( disk_gb >= MIN_DISK_GB )); then pass "free disk: ${disk_gb} GiB"; else fail "free disk ${disk_gb} GiB is below ${MIN_DISK_GB} GiB"; fi

if have git; then pass "Git available: $(git --version)"; else fail "Git is missing"; fi
if have docker; then
  pass "Docker CLI available"
  if docker info >/dev/null 2>&1; then pass "Docker daemon reachable"; else fail "Docker daemon is not reachable by this user"; fi
  if docker compose version >/dev/null 2>&1; then pass "Docker Compose v2 available"; else fail "Docker Compose v2 is missing"; fi
else
  fail "Docker is missing"
fi

if have ss; then
  for port in 80 443; do
    if ss -H -ltn "sport = :$port" 2>/dev/null | grep -q .; then
      warn "TCP port $port is already in use; confirm it belongs to the intended reverse proxy"
    else
      pass "TCP port $port is available"
    fi
  done
else
  warn "ss is unavailable; ports 80 and 443 were not inspected"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  fail "environment file is missing: $ENV_FILE"
else
  mode="$(stat -c '%a' "$ENV_FILE")"
  if [[ "$mode" == "600" || "$mode" == "400" ]]; then pass "environment file permissions are $mode"; else fail "environment file must be mode 0600 or 0400 (current: $mode)"; fi
  if "$SCRIPT_DIR/validate-deploy-env.py" "$ENV_FILE"; then pass "deployment environment is valid"; else fail "deployment environment validation failed"; fi
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  fail "Compose file is missing: $COMPOSE_FILE"
elif have docker && docker compose version >/dev/null 2>&1 && [[ -f "$ENV_FILE" ]]; then
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet; then
    pass "Docker Compose configuration is valid"
  else
    fail "Docker Compose configuration is invalid"
  fi
fi

printf '\nPreflight summary: %d blocking failure(s), %d warning(s).\n' "$failures" "$warnings"
(( failures == 0 ))
