SHELL := /bin/bash

.PHONY: backend-test docker-build docker-up docker-down

backend-test:
	docker compose run --rm backend pytest -q

docker-build:
	docker compose build

docker-up:
	docker compose up --build

docker-down:
	docker compose down
