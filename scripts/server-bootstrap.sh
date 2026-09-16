#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]] || [[ ! -r /etc/os-release ]]; then
  echo "ERROR: this bootstrap supports Ubuntu 24.04 Linux only." >&2
  exit 1
fi
# shellcheck disable=SC1091
. /etc/os-release
if [[ "${ID:-}" != "ubuntu" || "${VERSION_ID:-}" != "24.04" ]]; then
  echo "ERROR: Ubuntu 24.04 is required; detected ${PRETTY_NAME:-unknown}." >&2
  exit 1
fi
if [[ "${EUID}" -eq 0 ]]; then
  SUDO=()
elif command -v sudo >/dev/null 2>&1; then
  SUDO=(sudo)
else
  echo "ERROR: run as root or install/configure sudo." >&2
  exit 1
fi

echo "Updating apt metadata and installing non-secret server utilities..."
"${SUDO[@]}" apt-get update
"${SUDO[@]}" apt-get install -y git curl ca-certificates gnupg lsb-release ufw jq openssl

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Installing Docker Engine from Docker's signed Ubuntu repository..."
  "${SUDO[@]}" install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | "${SUDO[@]}" gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
  "${SUDO[@]}" chmod a+r /etc/apt/keyrings/docker.gpg
  ARCH="$(dpkg --print-architecture)"
  CODENAME="${UBUNTU_CODENAME:-$VERSION_CODENAME}"
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu %s stable\n' "$ARCH" "$CODENAME" \
    | "${SUDO[@]}" tee /etc/apt/sources.list.d/docker.list >/dev/null
  "${SUDO[@]}" apt-get update
  "${SUDO[@]}" apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

"${SUDO[@]}" systemctl enable --now docker
DEPLOY_OWNER="${SUDO_USER:-$(id -un)}"
DEPLOY_GROUP="$(id -gn "$DEPLOY_OWNER")"
if [[ "$DEPLOY_OWNER" != "root" ]] && ! id -nG "$DEPLOY_OWNER" | tr ' ' '\n' | grep -qx docker; then
  "${SUDO[@]}" usermod -aG docker "$DEPLOY_OWNER"
  echo "Added $DEPLOY_OWNER to the docker group; log out and back in before deployment."
  echo "WARNING: docker group membership grants root-equivalent host access."
fi
DEPLOY_ROOT="${DOCNEAR_DEPLOY_ROOT:-/srv/docnear}"
"${SUDO[@]}" install -d -o "$DEPLOY_OWNER" -g "$DEPLOY_GROUP" -m 0750 "$DEPLOY_ROOT" "$DEPLOY_ROOT/releases" "$DEPLOY_ROOT/shared"
"${SUDO[@]}" install -d -o "$DEPLOY_OWNER" -g "$DEPLOY_GROUP" -m 0700 "$DEPLOY_ROOT/shared/backups" "$DEPLOY_ROOT/shared/env"

cat <<EOF

Bootstrap complete. Docker: $(docker --version)
Compose: $(docker compose version)
Deployment directories: $DEPLOY_ROOT

Firewall recommendations (review before applying):
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow OpenSSH
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable

Do not expose PostgreSQL 5432, Redis 6379, or backend 8000 publicly.
This script did not change SSH settings, clone a repository, configure secrets,
or enable the firewall. Clone the private repository manually with scoped credentials.
EOF
