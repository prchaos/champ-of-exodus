# Non-secret values only. db_password, nextauth_secret, auth_discord_id,
# and auth_discord_secret are injected at plan/apply time from the
# KMS-decrypted secrets file via a generated, gitignored
# terraform.auto.tfvars.json — see README.md "Managing Secrets". Never add
# real secret values to this file.

project_id = "ashendeng-dev"
region     = "us-central1"

# wom_group_id defaults to "15387" (see variables.tf) — override here only
# if the clan's Wise Old Man group id ever changes.

# nextauth_url is set here as a real value only after the first successful
# deploy, once the Cloud Run service's stable *.run.app URL is known — see
# cloudrun.tf's comment on the nextauth_url variable.
