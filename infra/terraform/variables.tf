variable "project_id" {
  description = "GCP project id"
  type        = string
}

variable "region" {
  description = "Primary region"
  type        = string
  default     = "us-central1"
}

# Anticipates a not-yet-built Discord webhook announcement feature. No
# corresponding Secret Manager resource is created for this yet — it's
# just reserved so the name is settled when that feature is built.
variable "discord_webhook_secret_name" {
  description = "Secret Manager secret name for Discord webhook URL"
  type        = string
  default     = "discord-webhook-url"
}

variable "wom_group_id" {
  description = "Wise Old Man group id the /members page reads from. Not secret."
  type        = string
  default     = "15387"
}

# Cloud Run's URL isn't known before the service first exists, so this
# can't be Terraform-computed on the very first apply. Left blank until
# the first deploy succeeds, then set for real in terraform.tfvars (the
# URL is stable across redeploys, so this is a one-time follow-up).
variable "nextauth_url" {
  description = "Public base URL of the deployed app, used by NextAuth. Set after the first successful deploy."
  type        = string
  default     = ""
}

# The four variables below are real secrets. They are never set in a
# committed .tfvars file — they arrive only via the generated, gitignored
# terraform.auto.tfvars.json produced by scripts/kms-decrypt-secrets.sh
# (see README.md "Managing Secrets").

variable "db_password" {
  description = "Password for the Cloud SQL application user"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "Random secret used by NextAuth to sign session tokens"
  type        = string
  sensitive   = true
}

variable "auth_discord_id" {
  description = "Discord OAuth application client id"
  type        = string
  sensitive   = true
}

variable "auth_discord_secret" {
  description = "Discord OAuth application client secret"
  type        = string
  sensitive   = true
}
