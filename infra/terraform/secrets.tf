locals {
  # Cloud Run's secret_key_ref injects each secret as a raw env var with no
  # templating, and Prisma just wants one DATABASE_URL, exactly like it
  # gets locally via docker-compose.yml — so the full connection string is
  # composed once here, rather than making the running container assemble
  # it from parts at startup.
  database_url = "postgresql://${google_sql_user.champ_app.name}:${var.db_password}@localhost/${google_sql_database.champ_of_exodus.name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}&schema=public"
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = local.database_url
}

resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "nextauth-secret"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = var.nextauth_secret
}

resource "google_secret_manager_secret" "auth_discord_id" {
  secret_id = "auth-discord-id"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "auth_discord_id" {
  secret      = google_secret_manager_secret.auth_discord_id.id
  secret_data = var.auth_discord_id
}

resource "google_secret_manager_secret" "auth_discord_secret" {
  secret_id = "auth-discord-secret"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "auth_discord_secret" {
  secret      = google_secret_manager_secret.auth_discord_secret.id
  secret_data = var.auth_discord_secret
}

# The Cloud Run runtime service account (champ-run-sa, bootstrap-created —
# see README.md "One-Time Infrastructure Setup") only ever needs to READ
# these secret values, never manage them.
locals {
  runtime_secrets = {
    db_password         = google_secret_manager_secret.db_password.id
    database_url        = google_secret_manager_secret.database_url.id
    nextauth_secret     = google_secret_manager_secret.nextauth_secret.id
    auth_discord_id     = google_secret_manager_secret.auth_discord_id.id
    auth_discord_secret = google_secret_manager_secret.auth_discord_secret.id
  }
}

resource "google_secret_manager_secret_iam_member" "runtime_access" {
  for_each  = local.runtime_secrets
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:champ-run-sa@${var.project_id}.iam.gserviceaccount.com"
}
