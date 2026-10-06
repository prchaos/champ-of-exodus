-- Runs once, only on first container init (postgres:16-alpine executes
-- everything in /docker-entrypoint-initdb.d on an empty data directory).
-- Mirrors the second database events-admin owns in production
-- (infra/terraform/cloudsql.tf's google_sql_database.events_admin) — local
-- dev needs it created explicitly since Postgres only auto-creates the one
-- database named by POSTGRES_DB.
CREATE DATABASE events_admin;
