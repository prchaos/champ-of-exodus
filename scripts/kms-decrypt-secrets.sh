#!/usr/bin/env bash
#
# Decrypts secrets/prod.env.enc back into secrets/prod.env (plaintext,
# gitignored). Used both locally and by the GitHub Actions pipeline (after
# it has authenticated via Workload Identity Federation).
#
# Never echoes decrypted contents — see README.md "Managing Secrets".

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

PROJECT_ID="${WOM_KMS_PROJECT_ID:-ashendeng-dev}"
LOCATION="${WOM_KMS_LOCATION:-us-central1}"
KEYRING="${WOM_KMS_KEYRING:-champ-of-exodus}"
KEY="${WOM_KMS_KEY:-env-secrets}"

PLAINTEXT_FILE="${REPO_ROOT}/secrets/prod.env"
CIPHERTEXT_FILE="${REPO_ROOT}/secrets/prod.env.enc"

if [[ ! -f "${CIPHERTEXT_FILE}" ]]; then
  echo "error: ${CIPHERTEXT_FILE} not found." >&2
  exit 1
fi

base64 --decode < "${CIPHERTEXT_FILE}" \
  | gcloud kms decrypt \
      --project="${PROJECT_ID}" --location="${LOCATION}" --keyring="${KEYRING}" --key="${KEY}" \
      --ciphertext-file=- --plaintext-file="${PLAINTEXT_FILE}"

echo "Decrypted ${CIPHERTEXT_FILE} -> ${PLAINTEXT_FILE}"
