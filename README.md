# Champ of Exodus

An Old School Runescape clan site built with:
- Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- Prisma + PostgreSQL
- Discord OAuth sign-in (NextAuth / Auth.js)
- Docker Compose for local development
- Terraform + GitHub Actions for GCP deployment 

## Repository Structure

- `frontend/` Next.js app (pages, API routes, Prisma schema)
- `infra/terraform/` GCP infrastructure (Cloud SQL, Secret Manager, Cloud Run, GCS)
- `.github/workflows/` CI/CD pipelines
- `scripts/` KMS secret encrypt/decrypt scripts, local dev helpers

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
- `WOM_GROUP_ID` — Wise Old Man group id the `/members` page pulls its roster from

In production, `DATABASE_URL` (via `DB_PASSWORD`), `NEXTAUTH_SECRET`,
`AUTH_DISCORD_ID`, and `AUTH_DISCORD_SECRET` flow through the KMS →
Terraform → Secret Manager pipeline described below, not a `.env` file —
Cloud Run reads them from Secret Manager at container start.

## One-Time Infrastructure Setup

Everything below is run **once**, by hand, before the first GitHub Actions
deploy — none of it is repeated by CI. All commands target the GCP project
`ashendeng-dev` unless noted.

1. **Enable required APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
     storage.googleapis.com sqladmin.googleapis.com cloudkms.googleapis.com \
     iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
     cloudresourcemanager.googleapis.com --project=ashendeng-dev
   ```

2. **Terraform state bucket** (Terraform can't create the bucket it also
   uses as its own backend):
   ```bash
   gcloud storage buckets create gs://ashendeng-dev-tfstate \
     --project=ashendeng-dev --location=us-central1 --uniform-bucket-level-access
   gcloud storage buckets update gs://ashendeng-dev-tfstate --versioning
   ```

3. **Artifact Registry repository** (created manually, not by Terraform —
   the pipeline pushes to it *before* `terraform apply` runs, so it must
   already exist):
   ```bash
   gcloud artifacts repositories create champ-of-exodus \
     --project=ashendeng-dev --location=us-central1 --repository-format=docker
   ```

4. **KMS keyring + key** for encrypting production secrets:
   ```bash
   gcloud kms keyrings create champ-of-exodus --project=ashendeng-dev --location=us-central1
   gcloud kms keys create env-secrets \
     --project=ashendeng-dev --location=us-central1 --keyring=champ-of-exodus --purpose=encryption
   ```

5. **Workload Identity Federation** — lets GitHub Actions authenticate to
   GCP with no long-lived keys. Creates three service accounts:
   `champ-deploy` (the main pipeline: build/plan/apply/deploy),
   `champ-plan-readonly` (PR preview: plan only), and `champ-run-sa` (the
   Cloud Run service's own minimal runtime identity).
   ```bash
   gcloud iam workload-identity-pools create github-pool \
     --project=ashendeng-dev --location=global --display-name="GitHub Actions Pool"

   gcloud iam workload-identity-pools providers create-oidc github-provider \
     --project=ashendeng-dev --location=global --workload-identity-pool=github-pool \
     --display-name="GitHub OIDC Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
     --attribute-condition="assertion.repository=='prchaos/champ-of-exodus'" \
     --issuer-uri="https://token.actions.githubusercontent.com"

   gcloud iam service-accounts create champ-deploy --project=ashendeng-dev \
     --display-name="CI/CD deploy service account"
   gcloud iam service-accounts create champ-plan-readonly --project=ashendeng-dev \
     --display-name="CI/CD read-only plan service account"
   gcloud iam service-accounts create champ-run-sa --project=ashendeng-dev \
     --display-name="Cloud Run runtime service account"

   # Note the project number printed here — you'll need it below and in
   # both .github/workflows/*.yml files (replace PROJECT_NUMBER).
   gcloud projects describe ashendeng-dev --format='value(projectNumber)'

   gcloud iam service-accounts add-iam-policy-binding \
     champ-deploy@ashendeng-dev.iam.gserviceaccount.com --project=ashendeng-dev \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/prchaos/champ-of-exodus"

   gcloud iam service-accounts add-iam-policy-binding \
     champ-plan-readonly@ashendeng-dev.iam.gserviceaccount.com --project=ashendeng-dev \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/prchaos/champ-of-exodus"
   ```
   (Requires `export PROJECT_NUMBER=<the number printed above>` in your shell first — the commands interpolate it via `$PROJECT_NUMBER`.)

6. **Grant IAM roles**:
   ```bash
   # champ-deploy
   for role in roles/run.admin roles/artifactregistry.writer roles/cloudsql.admin \
               roles/secretmanager.admin roles/storage.admin roles/iam.serviceAccountUser \
               roles/serviceusage.serviceUsageConsumer; do
     gcloud projects add-iam-policy-binding ashendeng-dev \
       --member="serviceAccount:champ-deploy@ashendeng-dev.iam.gserviceaccount.com" --role="$role"
   done

   # champ-plan-readonly
   # secretAccessor is required because `terraform plan` refreshes existing
   # google_secret_manager_secret_version resources before diffing, which
   # reads the live secret payload (secretmanager.versions.access) even
   # though plan never writes anything. This repo is public, and the PR
   # preview workflow's Workload Identity Federation binding matches on the
   # base repo name (not the fork), so a malicious PR can run as this SA —
   # treat champ-plan-readonly as having read access to all secrets in this
   # project, not as a purely metadata-only viewer.
   for role in roles/viewer roles/storage.objectViewer roles/secretmanager.secretAccessor; do
     gcloud projects add-iam-policy-binding ashendeng-dev \
       --member="serviceAccount:champ-plan-readonly@ashendeng-dev.iam.gserviceaccount.com" --role="$role"
   done

   # champ-run-sa
   for role in roles/cloudsql.client roles/secretmanager.secretAccessor; do
     gcloud projects add-iam-policy-binding ashendeng-dev \
       --member="serviceAccount:champ-run-sa@ashendeng-dev.iam.gserviceaccount.com" --role="$role"
   done

   # Key-scoped KMS decrypt access (both deploy and plan-readonly need this)
   for sa in champ-deploy champ-plan-readonly; do
     gcloud kms keys add-iam-policy-binding env-secrets \
       --keyring=champ-of-exodus --location=us-central1 --project=ashendeng-dev \
       --member="serviceAccount:${sa}@ashendeng-dev.iam.gserviceaccount.com" \
       --role="roles/cloudkms.cryptoKeyDecrypter"
   done
   ```

7. **GitHub Environment (the "Deploy to Production?" gate)** — can't be
   created via YAML:
   - Repo → **Settings → Environments → New environment**, name it exactly
     `production`.
   - Under **Deployment protection rules**, enable **Required reviewers**
     and add yourself (and anyone else who should approve deploys).
   - Every deploy from now on pauses with a "Review deployments" button in
     the Actions run UI until approved.

8. **Fill in `PROJECT_NUMBER`** in both `.github/workflows/deploy.yml` and
   `.github/workflows/terraform-plan-preview.yml` with the value from step 5.

9. **Encrypt your production secrets** — see "Managing Secrets" below.

## Managing Secrets

Production secret values (`NEXTAUTH_SECRET`, `AUTH_DISCORD_ID`,
`AUTH_DISCORD_SECRET`, `DB_PASSWORD`) never touch git in plaintext. They're
KMS-encrypted locally and decrypted only inside the GitHub Actions runner
(after it authenticates via Workload Identity Federation) or on your own
machine.

1. Create `secrets/prod.env` (gitignored, **never commit this file**):
   ```
   NEXTAUTH_SECRET=...
   AUTH_DISCORD_ID=...
   AUTH_DISCORD_SECRET=...
   DB_PASSWORD=...
   ```
2. Encrypt it:
   ```bash
   make kms-encrypt-secrets
   ```
   This produces `secrets/prod.env.enc` (base64-encoded ciphertext) — commit
   *this* file.
3. To read the current values back (e.g. to update one):
   ```bash
   make kms-decrypt-secrets
   ```
   Reconstitutes `secrets/prod.env` locally. Re-encrypt and commit after
   editing.

`WOM_GROUP_ID` and `NEXTAUTH_URL` are **not** secret and are set directly
as plain Terraform variables in `infra/terraform/terraform.tfvars` instead
(see that file's comments — `nextauth_url` specifically can only be filled
in after your first successful deploy, once the Cloud Run URL is known).

## Production Deployment

Push to `main` and GitHub Actions takes it from there:

1. **Build, plan, push** (`build-plan` job, runs immediately) — builds the
   Docker image, runs `terraform plan` and posts it to the workflow run's
   summary, then pushes the image to Artifact Registry. Nothing
   production-facing changes yet.
2. **Deploy to Production?** — the pipeline pauses. Review the plan in the
   run summary, then approve in the Actions UI (`production` environment).
3. **Apply and deploy** (`approve-and-deploy` job) — applies exactly the
   reviewed Terraform plan, then deploys the pushed image to Cloud Run. The
   live URL is printed in the run summary.

A second, read-only workflow (`terraform-plan-preview.yml`) runs on every
PR targeting `main` — shows what Terraform *would* do, never applies or
deploys, requires no approval.

Prerequisite: complete "One-Time Infrastructure Setup" above first — none
of this works against a project with no Terraform state bucket, Artifact
Registry repo, KMS key, or Workload Identity Federation set up yet.
