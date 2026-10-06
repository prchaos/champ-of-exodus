# Events Admin — First-Time Setup

Everything below is one-time work to take the `events-admin` service (and the
homepage integration that reads its events) from "code on disk" to "committed,
deployed, and usable." Steps 1–4 happen locally, before you commit anything.
Steps 5–6 happen after you push and the pipeline runs. Do them in order —
several later steps depend on resources the pipeline creates.

Everything here is also covered in more depth in `README.md`'s "One-Time
Infrastructure Setup" and "Managing Secrets" sections — this file is the
condensed, ordered checklist for this specific rollout.

---

## Before committing

### 1. Add the four new production secrets

`events-admin` needs four new secret values that don't exist yet. Generate
each one the same way as the existing `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Open `secrets/prod.env` (gitignored — never commit this file) and add:

```
EVENTS_ADMIN_DB_PASSWORD=<generated>
EVENTS_ADMIN_EVENTS_WRITER_PASSWORD=<generated>
EVENTS_ADMIN_SESSION_SECRET=<generated>
EVENTS_ADMIN_TOTP_ENCRYPTION_KEY=<generated>
```

It should end up with 8 keys total (the original 4 plus these 4). Then
re-encrypt:

```bash
make kms-encrypt-secrets
```

This overwrites `secrets/prod.env.enc` — **that file should show up as
modified and needs to be committed** (it's the only place these new secrets
persist outside your machine).

### 2. Decide who can access the deployed service

Unlike the public `champ-frontend`, `champ-events-admin` is **not**
`--allow-unauthenticated`. Nobody can open it until you name specific GCP
identities. Edit `infra/terraform/terraform.tfvars` and add:

```hcl
events_admin_authorized_members = [
  "user:you@example.com", # replace with your real Google account
]
```

If you skip this, Terraform still deploys the service — it'll just be
unreachable by anyone (including you) until you come back and set it.

### 3. Bootstrap the new GCP service account

This is the same kind of manual, one-time `gcloud` setup the original three
service accounts (`champ-deploy`, `champ-plan-readonly`, `champ-run-sa`)
already went through — `champ-events-admin-run-sa` needs the same treatment:

```bash
gcloud iam service-accounts create champ-events-admin-run-sa \
  --project=ashendeng-dev \
  --display-name="events-admin Cloud Run runtime service account"

gcloud projects add-iam-policy-binding ashendeng-dev \
  --member="serviceAccount:champ-events-admin-run-sa@ashendeng-dev.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

That's the only manual IAM grant it needs — its Secret Manager access is
already handled per-secret by Terraform
(`google_secret_manager_secret_iam_member.events_admin_runtime_access`).

### 4. (Recommended) Sanity-check locally first

Catch problems before they hit production:

```bash
make events-admin-migrate
make events-admin-seed-admin
make events-admin-up
```

Visit `http://localhost:3001`, log in with the username/password you just
seeded, scan the QR code with an authenticator app, and confirm you can
create and edit an event. Then check `http://localhost:3000` shows it on the
homepage.

### 5. Commit and push

```bash
git add -A
git commit -m "Add events-admin service"
git push -u origin feat/create-admin-event-service
```

Open a PR against `main`. The `terraform-plan-preview.yml` workflow will run
automatically and show you the full infrastructure diff (new Cloud SQL
database/users, four new secrets, the new Cloud Run service) — review it
before merging.

---

## After merging to main (pipeline runs)

Pushing to `main` triggers `deploy.yml`: it builds both Docker images, runs
`terraform plan`, and pauses at the **"Deploy to Production?"** manual
approval gate. Once you approve it, `terraform apply` creates the new
database/users/secrets/Cloud Run service, migrations run, and both services
deploy.

### 6. Grant the events-admin database user table-level access

Cloud SQL's Terraform provider can create the `events_admin_events_writer`
login but can't grant it per-table permissions — that's a manual step, done
once, right after the first successful apply:

```bash
gcloud sql connect champ-postgres --user=champ_app --database=champ_of_exodus
```

Then in the `psql` prompt:

```sql
REVOKE ALL ON SCHEMA public FROM events_admin_events_writer;
GRANT CONNECT ON DATABASE champ_of_exodus TO events_admin_events_writer;
GRANT USAGE ON SCHEMA public TO events_admin_events_writer;
GRANT SELECT, INSERT, UPDATE ON "Event" TO events_admin_events_writer;
```

### 7. Seed the first admin account

There's no self-signup UI by design. This needs a real TCP connection (not
`gcloud sql connect`'s interactive shell, since it's the Node script
connecting, not `psql`), so grab the Cloud SQL Auth Proxy first:

```bash
curl -sSL -o cloud-sql-proxy \
  "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.0/cloud-sql-proxy.linux.amd64"  # macOS: swap linux.amd64 for darwin.amd64 or darwin.arm64
chmod +x cloud-sql-proxy

CONNECTION_NAME="$(gcloud sql instances describe champ-postgres --format='value(connectionName)')"
./cloud-sql-proxy --port 5433 "${CONNECTION_NAME}" &

ADMIN_DATABASE_URL="postgresql://events_admin_app:<EVENTS_ADMIN_DB_PASSWORD from secrets/prod.env>@127.0.0.1:5433/events_admin?schema=public" \
  npx tsx events-admin/scripts/seed-admin.ts
```

You'll be prompted for a username and password interactively (never pass the
password as an argument).

### 8. Verify end-to-end

1. Find the deployed URL: `gcloud run services describe champ-events-admin --region=us-central1 --format='value(status.url)'`
2. Reach it as one of the accounts you listed in `events_admin_authorized_members` —
   either `gcloud run services proxy champ-events-admin --region=us-central1`,
   or open the URL directly while signed into an authorized Google account.
3. Log in with the account you just seeded, complete MFA enrollment.
4. Create a test event, confirm it shows up on the live homepage
   (`champ-frontend`'s URL) with your username as the poster.
5. Edit the event, confirm the change reflects.
6. Leave the tab idle 15+ minutes, confirm it forces you back to the login page.

---

## Quick reference: what's already automated vs. what's manual

| Step | Automated by |
|---|---|
| Building & pushing both Docker images | `deploy.yml` |
| Creating the Cloud SQL database/users, secrets, Cloud Run service | `terraform apply` (in `deploy.yml`, after approval) |
| Applying database migrations | `deploy.yml`'s "Apply events-admin database migrations" step |
| Deploying both Cloud Run services | `deploy.yml` |
| Granting `champ-events-admin-run-sa` Secret Manager access | Terraform (per-secret) |
| Granting `champ-events-admin-run-sa` Cloud SQL access | **Manual** (step 3 above, one-time) |
| Granting `events_admin_events_writer` table-level DB access | **Manual** (step 6 above, one-time, needs the user to exist first) |
| Naming who can access the deployed service | **Manual** (`events_admin_authorized_members` in `terraform.tfvars`) |
| Creating the first admin login | **Manual** (`seed-admin.ts` — no self-signup by design) |
