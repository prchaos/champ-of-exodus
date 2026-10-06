locals {
  # Cloud Run's secret_key_ref injects each secret as a raw env var with no
  # templating, and Prisma just wants one DATABASE_URL, exactly like it
  # gets locally via docker-compose.yml — so the full connection string is
  # composed once here, rather than making the running container assemble
  # it from parts at startup.
  database_url = "postgresql://${google_sql_user.champ_app.name}:${var.db_password}@localhost/${google_sql_database.champ_of_exodus.name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}&schema=public"

  # events-admin's two connection strings — its own database, and a
  # narrow-credential connection into champ_of_exodus for the Event table.
  # Passwords are percent-encoded: base64 output can contain / + = which would
  # otherwise be parsed as URL structure.
  events_admin_database_url        = "postgresql://${google_sql_user.events_admin_app.name}:${urlencode(var.events_admin_db_password)}@localhost/${google_sql_database.events_admin.name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}&schema=public"
  events_admin_events_database_url = "postgresql://${google_sql_user.events_admin_events_writer.name}:${urlencode(var.events_admin_events_writer_password)}@localhost/${google_sql_database.champ_of_exodus.name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}&schema=public"
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

# --- events-admin secrets ---

resource "google_secret_manager_secret" "events_admin_database_url" {
  secret_id = "events-admin-database-url"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "events_admin_database_url" {
  secret      = google_secret_manager_secret.events_admin_database_url.id
  secret_data = local.events_admin_database_url
}

resource "google_secret_manager_secret" "events_admin_events_database_url" {
  secret_id = "events-admin-events-database-url"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "events_admin_events_database_url" {
  secret      = google_secret_manager_secret.events_admin_events_database_url.id
  secret_data = local.events_admin_events_database_url
}

resource "google_secret_manager_secret" "events_admin_session_secret" {
  secret_id = "events-admin-session-secret"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "events_admin_session_secret" {
  secret      = google_secret_manager_secret.events_admin_session_secret.id
  secret_data = var.events_admin_session_secret
}

# Encrypts each AdminUser.totpSecret at rest (see events-admin/lib/auth/crypto.ts)
# — infra-level because it protects every admin's MFA seed, distinct from
# any single user's own per-account TOTP secret.
resource "google_secret_manager_secret" "events_admin_totp_encryption_key" {
  secret_id = "events-admin-totp-encryption-key"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "events_admin_totp_encryption_key" {
  secret      = google_secret_manager_secret.events_admin_totp_encryption_key.id
  secret_data = var.events_admin_totp_encryption_key
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

  # Kept in a separate map (rather than merged into runtime_secrets) so it
  # can be granted to champ-events-admin-run-sa only — a compromised
  # frontend runtime identity should never be able to read these, and vice
  # versa.
  events_admin_runtime_secrets = {
    events_admin_database_url        = google_secret_manager_secret.events_admin_database_url.id
    events_admin_events_database_url = google_secret_manager_secret.events_admin_events_database_url.id
    events_admin_session_secret      = google_secret_manager_secret.events_admin_session_secret.id
    events_admin_totp_encryption_key = google_secret_manager_secret.events_admin_totp_encryption_key.id
  }
}

resource "google_secret_manager_secret_iam_member" "runtime_access" {
  for_each  = local.runtime_secrets
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:champ-run-sa@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "events_admin_runtime_access" {
  for_each  = local.events_admin_runtime_secrets
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:champ-events-admin-run-sa@${var.project_id}.iam.gserviceaccount.com"
}
