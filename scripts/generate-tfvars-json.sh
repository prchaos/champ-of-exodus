#!/usr/bin/env bash
#
# Converts the decrypted secrets/prod.env (KEY=value lines) into
# infra/terraform/terraform.auto.tfvars.json, which Terraform auto-loads
# with no extra flags. Gitignored, regenerated fresh on every run — see
# README.md "Managing Secrets".

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

PLAINTEXT_FILE="${REPO_ROOT}/secrets/prod.env"
OUTPUT_FILE="${REPO_ROOT}/infra/terraform/terraform.auto.tfvars.json"

if [[ ! -f "${PLAINTEXT_FILE}" ]]; then
  echo "error: ${PLAINTEXT_FILE} not found — run scripts/kms-decrypt-secrets.sh first." >&2
  exit 1
fi

rm -f "${OUTPUT_FILE}"

json="{}"
while IFS= read -r line || [[ -n "${line}" ]]; do
  [[ -z "${line}" || "${line}" == \#* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  case "${key}" in
    NEXTAUTH_SECRET)                       varname="nextauth_secret" ;;
    AUTH_DISCORD_ID)                       varname="auth_discord_id" ;;
    AUTH_DISCORD_SECRET)                   varname="auth_discord_secret" ;;
    DB_PASSWORD)                           varname="db_password" ;;
    EVENTS_ADMIN_DB_PASSWORD)              varname="events_admin_db_password" ;;
    EVENTS_ADMIN_EVENTS_WRITER_PASSWORD)   varname="events_admin_events_writer_password" ;;
    EVENTS_ADMIN_SESSION_SECRET)           varname="events_admin_session_secret" ;;
    EVENTS_ADMIN_TOTP_ENCRYPTION_KEY)      varname="events_admin_totp_encryption_key" ;;
    *)                                     continue ;;
  esac
  json="$(printf '%s' "${json}" | jq --arg k "${varname}" --arg v "${value}" '. + {($k): $v}')"
done < "${PLAINTEXT_FILE}"

printf '%s\n' "${json}" > "${OUTPUT_FILE}"
echo "Wrote ${OUTPUT_FILE}"
