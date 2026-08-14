#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

echo "Starting Postgres..."
docker compose up -d db

echo "Building frontend image..."
docker compose build frontend

echo "Applying database migrations..."
docker compose run --rm frontend npx prisma migrate deploy

echo "Starting frontend for local testing on http://localhost:3000 ..."
docker compose up frontend
