SHELL := /bin/bash

.PHONY: db-up prisma-migrate prisma-studio docker-build docker-up docker-down kms-encrypt-secrets kms-decrypt-secrets \
	events-admin-migrate events-admin-seed-admin events-admin-up

db-up:
	docker compose up -d db

prisma-migrate:
	cd frontend && npx prisma migrate dev

prisma-studio:
	cd frontend && npx prisma studio

docker-build:
	docker compose build

docker-up: db-up
	docker compose run --rm frontend npx prisma migrate deploy
	docker compose up --build frontend

docker-down:
	docker compose down

# events-admin owns two Prisma schemas (its own events_admin tables, plus
# migrations for the shared Event table) — see events-admin/scripts/migrate.sh.
events-admin-migrate: db-up
	docker compose run --build --rm events-admin sh scripts/migrate.sh

events-admin-seed-admin: db-up
	docker compose run --build --rm events-admin npm run seed:admin

events-admin-up: db-up events-admin-migrate
	docker compose up --build events-admin

kms-encrypt-secrets:
	bash scripts/kms-encrypt-secrets.sh

kms-decrypt-secrets:
	bash scripts/kms-decrypt-secrets.sh
