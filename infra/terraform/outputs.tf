output "asset_bucket_name" {
  value = google_storage_bucket.assets.name
}

output "load_balancer_ip" {
  value = google_compute_global_address.lb_ip.address
}

output "dns_name_servers" {
  value = google_dns_managed_zone.public_zone.name_servers
}
