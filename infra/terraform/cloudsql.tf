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
