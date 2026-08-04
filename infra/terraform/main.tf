resource "google_project_service" "required" {
  for_each = toset([
    "run.googleapis.com",
    "compute.googleapis.com",
    "dns.googleapis.com",
    "firestore.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com",
  ])

  project = var.project_id
  service = each.key
}

resource "google_storage_bucket" "assets" {
  name                        = "${var.project_id}-champ-assets"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  depends_on = [google_project_service.required]
}

resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.required]
}

resource "google_compute_managed_ssl_certificate" "cert" {
  name = "champ-managed-cert"

  managed {
    domains = [
      "${var.frontend_subdomain}.${var.domain_name}",
      "${var.api_subdomain}.${var.domain_name}",
    ]
  }
}

resource "google_dns_managed_zone" "public_zone" {
  name        = "champ-zone"
  dns_name    = "${var.domain_name}."
  description = "Public DNS zone for champ-of-exodus"

  depends_on = [google_project_service.required]
}

# Serverless NEGs point to Cloud Run services. Create Cloud Run services first via CI/CD.
resource "google_compute_region_network_endpoint_group" "frontend_neg" {
  name                  = "champ-frontend-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = "champ-frontend"
  }

  depends_on = [google_project_service.required]
}

resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "champ-api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = "champ-backend"
  }

  depends_on = [google_project_service.required]
}

resource "google_compute_backend_service" "frontend_backend" {
  name                  = "champ-frontend-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.frontend_neg.id
  }
}

resource "google_compute_backend_service" "api_backend" {
  name                  = "champ-api-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "champ-url-map"
  default_service = google_compute_backend_service.frontend_backend.id

  host_rule {
    hosts        = ["${var.api_subdomain}.${var.domain_name}"]
    path_matcher = "api-matcher"
  }

  path_matcher {
    name            = "api-matcher"
    default_service = google_compute_backend_service.api_backend.id
  }
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "champ-https-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}

resource "google_compute_global_address" "lb_ip" {
  name = "champ-lb-ip"
}

resource "google_compute_global_forwarding_rule" "https_rule" {
  name                  = "champ-https-forwarding-rule"
  target                = google_compute_target_https_proxy.https_proxy.id
  ip_address            = google_compute_global_address.lb_ip.address
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_dns_record_set" "frontend_a" {
  name         = "${var.frontend_subdomain}.${var.domain_name}."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public_zone.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}

resource "google_dns_record_set" "api_a" {
  name         = "${var.api_subdomain}.${var.domain_name}."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public_zone.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}
