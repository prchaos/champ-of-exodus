SHELL := /bin/bash

.PHONY: db-up prisma-migrate prisma-studio docker-build docker-up docker-down

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
