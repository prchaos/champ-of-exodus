# Champ of Exodus

An Old School Runescape clan site built with:
- Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- Prisma + PostgreSQL
- Discord OAuth sign-in (NextAuth / Auth.js)
- Docker Compose for local development
- Cloud Build and Cloud Run deployment assets

## Repository Structure

- `frontend/` Next.js app (pages, API routes, Prisma schema)
- `infra/terraform/` GCP infrastructure
- `deploy/` Cloud Run service manifest
- `cloudbuild.yaml` CI/CD pipeline for Cloud Build

## Local Prerequisites

- Docker Desktop
- A Discord application (for OAuth) — create one at https://discord.com/developers/applications
  and add redirect URI `http://localhost:3000/api/auth/callback/discord`

## Local Setup

1. Copy env templates:
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```
2. Fill in `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`) and your Discord app's
   `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` in both `.env` files.
3. Start Postgres and apply migrations:
   ```bash
   make db-up
   make prisma-migrate
   ```
4. Run the full stack:
   ```bash
   make docker-up
   ```
5. Visit the site at `http://localhost:3000`.

## Local Testing

- Browse the Prisma-backed database with `make prisma-studio`.

## Environment Variables

- `DATABASE_URL` — Postgres connection string (Prisma)
- `NEXTAUTH_URL` — base URL of the app (`http://localhost:3000` locally)
- `NEXTAUTH_SECRET` — random secret used to sign session tokens
- `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` — Discord OAuth app credentials

## Deploy with Cloud Build

Trigger build manually:
```bash
gcloud builds submit --config cloudbuild.yaml
```

Pipeline builds and pushes the frontend image, then deploys it to Cloud Run.

## Provision Infrastructure (Terraform)

From `infra/terraform`:
```bash
terraform init
terraform apply \
  -var="project_id=YOUR_PROJECT_ID" \
  -var="domain_name=example.com"
```

Note: Terraform currently provisions Firestore-era resources and will be updated for
Cloud SQL/Postgres as part of the Google Cloud deployment phase.

## Cloud Run

Use `deploy/cloudrun.yaml` as a baseline manifest. Store `DATABASE_URL`, `NEXTAUTH_SECRET`,
`AUTH_DISCORD_ID`, and `AUTH_DISCORD_SECRET` in Secret Manager and reference them from Cloud Run
as part of the Google Cloud deployment phase.

## Notes

- Replace placeholder image references in `deploy/cloudrun.yaml` before applying.
