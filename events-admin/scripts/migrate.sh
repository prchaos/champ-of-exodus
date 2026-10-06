#!/bin/sh
#
# Applies both Prisma schemas' pending migrations. Order matters only in
# that both must run; ADMIN_DATABASE_URL and EVENTS_DATABASE_URL must both
# be set in the environment (Cloud Run/CI inject them from Secret Manager,
# local dev from docker-compose.yml).
#
# POSIX sh on purpose: the node:20-alpine base image has no bash.

set -eu

cd "$(dirname "$0")/.."

echo "Applying events_admin migrations..."
npx prisma migrate deploy --schema=prisma/admin/schema.prisma

echo "Applying champ_of_exodus (Event table) migrations..."
npx prisma migrate deploy --schema=prisma/events/schema.prisma

echo "Migrations applied."
