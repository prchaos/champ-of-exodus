#!/usr/bin/env bash
#
# Encrypts secrets/prod.env (plaintext, never committed) into
# secrets/prod.env.enc (base64-encoded ciphertext, safe to commit) using
# the champ-of-exodus/env-secrets KMS key.
#
# Run this locally whenever you add/change a production secret value, then
# commit secrets/prod.env.enc. See README.md "Managing Secrets".

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

PROJECT_ID="${WOM_KMS_PROJECT_ID:-ashendeng-dev}"
LOCATION="${WOM_KMS_LOCATION:-us-central1}"
KEYRING="${WOM_KMS_KEYRING:-champ-of-exodus}"
KEY="${WOM_KMS_KEY:-env-secrets}"

PLAINTEXT_FILE="${REPO_ROOT}/secrets/prod.env"
CIPHERTEXT_FILE="${REPO_ROOT}/secrets/prod.env.enc"

REQUIRED_KEYS=(NEXTAUTH_SECRET AUTH_DISCORD_ID AUTH_DISCORD_SECRET DB_PASSWORD)

if [[ ! -f "${PLAINTEXT_FILE}" ]]; then
  echo "error: ${PLAINTEXT_FILE} not found." >&2
  echo "Create it with KEY=value lines for: ${REQUIRED_KEYS[*]}" >&2
  exit 1
fi

missing=()
for key in "${REQUIRED_KEYS[@]}"; do
  if ! grep -qE "^${key}=.+" "${PLAINTEXT_FILE}"; then
    missing+=("${key}")
  fi
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "error: ${PLAINTEXT_FILE} is missing or has an empty value for: ${missing[*]}" >&2
  exit 1
fi

if ! gcloud kms keys describe "${KEY}" \
  --project="${PROJECT_ID}" --location="${LOCATION}" --keyring="${KEYRING}" \
  >/dev/null 2>&1; then
  echo "error: couldn't reach KMS key '${KEY}' in keyring '${KEYRING}' (project ${PROJECT_ID}, location ${LOCATION})." >&2
  echo "Run 'gcloud auth login' if you're not authenticated, or confirm you have" >&2
  echo "roles/cloudkms.cryptoKeyEncrypter on this key." >&2
  exit 1
fi

if command -v git >/dev/null 2>&1 && ! git -C "${REPO_ROOT}" check-ignore -q "${PLAINTEXT_FILE}"; then
  echo "warning: ${PLAINTEXT_FILE} is NOT gitignored — check .gitignore before committing anything." >&2
fi

gcloud kms encrypt \
  --project="${PROJECT_ID}" --location="${LOCATION}" --keyring="${KEYRING}" --key="${KEY}" \
  --plaintext-file="${PLAINTEXT_FILE}" --ciphertext-file=- \
  | base64 > "${CIPHERTEXT_FILE}"

echo "Encrypted ${PLAINTEXT_FILE} -> ${CIPHERTEXT_FILE}"
echo "Next: git add ${CIPHERTEXT_FILE} and commit. Never commit ${PLAINTEXT_FILE}."
