output "asset_bucket_name" {
  value = google_storage_bucket.assets.name
}

output "cloud_run_url" {
  value = google_cloud_run_v2_service.frontend.uri
}

output "cloudsql_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}
