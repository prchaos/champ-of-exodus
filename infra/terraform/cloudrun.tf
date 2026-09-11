# Terraform owns this service's configuration (env vars, secret wiring,
# Cloud SQL connection, IAM) — but NOT which image tag is live. The
# placeholder image below only matters on the very first apply (Terraform
# needs *an* image to create the service with, before any real image has
# ever been pushed); every deploy after that is driven by the pipeline's
# `gcloud run deploy --image=...:$GITHUB_SHA` step, which this resource is
# told to ignore via lifecycle.ignore_changes so the two don't fight.
resource "google_cloud_run_v2_service" "frontend" {
  name     = "champ-frontend"
  location = var.region

  template {
    service_account = "champ-run-sa@${var.project_id}.iam.gserviceaccount.com"

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 3000
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.nextauth_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_DISCORD_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.auth_discord_id.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_DISCORD_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.auth_discord_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "WOM_GROUP_ID"
        value = var.wom_group_id
      }

      env {
        name  = "NEXTAUTH_URL"
        value = var.nextauth_url
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }

  # The env blocks above reference google_secret_manager_secret.*.secret_id,
  # which only gives Terraform an implicit dependency on the secret
  # *containers* existing — not on the secret *versions* having a value, or
  # on champ-run-sa actually being granted read access to them. Without
  # these explicit dependencies, Cloud Run can be created before the IAM
  # grant propagates, and GCP returns NOT_FOUND (not PERMISSION_DENIED) for
  # a secret the caller isn't yet authorized to read, which is misleading.
  depends_on = [
    google_project_service.required,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.nextauth_secret,
    google_secret_manager_secret_version.auth_discord_id,
    google_secret_manager_secret_version.auth_discord_secret,
    google_secret_manager_secret_iam_member.runtime_access,
  ]
}

# Public clan website — matches the --allow-unauthenticated flag already
# used in the (now-removed) manual Cloud Build deploy.
resource "google_cloud_run_v2_service_iam_member" "public" {
  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
