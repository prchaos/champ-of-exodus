#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

echo "Building frontend image..."
docker compose build frontend

echo "Starting frontend for local testing on http://localhost:3000 ..."
# This also starts dependent services defined in docker-compose.yml (e.g. backend).
docker compose up frontend
