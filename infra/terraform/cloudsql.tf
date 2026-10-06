# Cloud Run connects via the Cloud SQL Auth Proxy socket (see cloudrun.tf's
# volume/volume_mounts), not a private-IP/VPC-connector setup. There's no
# existing VPC work in this project, and the Auth Proxy path is encrypted
# and IAM-authenticated without needing one — Google's recommended default
# for serverless-to-Cloud-SQL.
resource "google_sql_database_instance" "postgres" {
  name                = "champ-postgres"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = true

  settings {
    tier = "db-f1-micro"

    ip_configuration {
      ipv4_enabled = true
    }
  }

  depends_on = [google_project_service.required]
}

resource "google_sql_database" "champ_of_exodus" {
  name     = "champ_of_exodus"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "champ_app" {
  name     = "champ_app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# events-admin's own database — login credentials, MFA, and audit log for
# that service only. No clan/event data lives here; see
# events_admin_events_writer below for the shared Event table.
resource "google_sql_database" "events_admin" {
  name     = "events_admin"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "events_admin_app" {
  name     = "events_admin_app"
  instance = google_sql_database_instance.postgres.name
  password = var.events_admin_db_password
}

# Narrow, table-scoped credential for events-admin's writes to the EXISTING
# champ_of_exodus database's Event table — deliberately NOT the same
# champ_app user frontend uses, and NOT granted access to
# Account/Session/User/VerificationToken/Rank. Cloud SQL's Terraform
# provider doesn't model per-table GRANTs, so the actual
# `GRANT SELECT, INSERT, UPDATE ON "Event"` (and a matching REVOKE of
# broader schema defaults) must be run once by hand after this user first
# exists — see README.md "One-Time Infrastructure Setup".
resource "google_sql_user" "events_admin_events_writer" {
  name     = "events_admin_events_writer"
  instance = google_sql_database_instance.postgres.name
  password = var.events_admin_events_writer_password
}
