# Champ of Exodus Template

Template project for an Old School Runescape clan site with:
- Next.js frontend (home, ranks, forum, events)
- Python FastAPI backend (events CRUD)
- Discord webhook integration when events are created
- Firestore and Cloud Storage integration (Google Cloud Python SDK)
- Docker local development
- Cloud Build and Cloud Run deployment assets
- Terraform for Load Balancer + Cloud DNS + Firestore + Bucket

## Repository Structure

- `frontend/` Next.js app
- `backend/` FastAPI app + pytest test suite
- `infra/terraform/` GCP infrastructure
- `deploy/` Cloud Run service manifests
- `cloudbuild.yaml` CI/CD pipeline for Cloud Build

## Local Prerequisites

- Docker Desktop
- A GCP service account JSON key with Firestore/Storage permissions
- Optional: real Discord webhook URL

## Local Setup

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Place your GCP key at `./secrets/key.json` (or update `GOOGLE_APPLICATION_CREDENTIALS_PATH` in `.env`).
3. Build images:
   ```bash
   make docker-build
   ```
4. Run stack:
   ```bash
   make docker-up
   ```
5. Visit frontend at `http://localhost:3000`.
6. Backend health check: `http://localhost:8000/health`.

## Local Testing

Run backend tests in Docker:
```bash
make backend-test
```

Tests mock all external Google SDK/network operations.

## Backend Environment Variables

- `GCP_PROJECT_ID` required
- `FIRESTORE_EVENTS_COLLECTION` default `events`
- `DISCORD_WEBHOOK_URL` optional (enables Discord posting)
- `GCS_BUCKET_NAME` optional unless uploading assets

## Deploy with Cloud Build

Trigger build manually:
```bash
gcloud builds submit --config cloudbuild.yaml
```

Pipeline builds and pushes backend/frontend images, then deploys both services to Cloud Run.

## Provision Infrastructure (Terraform)

From `infra/terraform`:
```bash
terraform init
terraform apply \
  -var="project_id=YOUR_PROJECT_ID" \
  -var="domain_name=example.com"
```

Provisioned resources include:
- Firestore native database
- Cloud Storage bucket for assets
- Cloud DNS managed zone and A records
- Global HTTPS external load balancer
- Serverless NEGs routing to Cloud Run frontend/backend

## Cloud Run

Use `deploy/cloudrun.yaml` as a baseline manifest for both services.
Store Discord webhook in Secret Manager and reference it from Cloud Run.

## Notes

- Replace placeholder image references in `deploy/cloudrun.yaml` before applying.
- If your project already has Firestore enabled, remove/reconcile the Firestore resource in Terraform.
