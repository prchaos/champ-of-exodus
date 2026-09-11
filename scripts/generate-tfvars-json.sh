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
while IFS='=' read -r key value; do
  [[ -z "${key}" || "${key}" == \#* ]] && continue
  case "${key}" in
    NEXTAUTH_SECRET)     varname="nextauth_secret" ;;
    AUTH_DISCORD_ID)     varname="auth_discord_id" ;;
    AUTH_DISCORD_SECRET) varname="auth_discord_secret" ;;
    DB_PASSWORD)         varname="db_password" ;;
    *)                   continue ;;
  esac
  json="$(printf '%s' "${json}" | jq --arg k "${varname}" --arg v "${value}" '. + {($k): $v}')"
done < "${PLAINTEXT_FILE}"

printf '%s\n' "${json}" > "${OUTPUT_FILE}"
echo "Wrote ${OUTPUT_FILE}"
