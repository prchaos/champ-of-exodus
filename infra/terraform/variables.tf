variable "project_id" {
  description = "GCP project id"
  type        = string
}

variable "region" {
  description = "Primary region"
  type        = string
  default     = "us-central1"
}

variable "domain_name" {
  description = "Base domain managed by Cloud DNS"
  type        = string
}

variable "frontend_subdomain" {
  description = "Frontend hostname"
  type        = string
  default     = "www"
}

variable "api_subdomain" {
  description = "API hostname"
  type        = string
  default     = "api"
}

variable "discord_webhook_secret_name" {
  description = "Secret Manager secret name for Discord webhook URL"
  type        = string
  default     = "discord-webhook-url"
}
