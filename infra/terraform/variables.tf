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

variable "events_admin_db_password" {
  description = "Password for the events_admin database's application user"
  type        = string
  sensitive   = true
}

variable "events_admin_events_writer_password" {
  description = "Password for the narrow, table-scoped user events-admin uses to read/write champ_of_exodus's Event table"
  type        = string
  sensitive   = true
}

variable "events_admin_session_secret" {
  description = "Random secret used by iron-session to encrypt the events-admin login cookie"
  type        = string
  sensitive   = true
}

variable "events_admin_totp_encryption_key" {
  description = "Random key used to encrypt each admin's TOTP secret at rest in the events_admin database"
  type        = string
  sensitive   = true
}

# events-admin's Cloud Run service is deliberately not --allow-unauthenticated
# (unlike champ-frontend) — only these principals get roles/run.invoker.
# Example: ["user:you@example.com"].
variable "events_admin_authorized_members" {
  description = "IAM members granted roles/run.invoker on the events-admin Cloud Run service"
  type        = list(string)
  default     = []
}
