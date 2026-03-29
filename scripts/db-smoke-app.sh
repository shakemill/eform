#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
DEMANDE_ID="${2:-}"

echo "App smoke check on ${BASE_URL}"
HOME_CODE="$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}")"
echo "GET / -> ${HOME_CODE}"

if [ -n "${DEMANDE_ID}" ]; then
  DEMANDE_CODE="$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/demandes/public/${DEMANDE_ID}")"
  echo "GET /api/demandes/public/${DEMANDE_ID} -> ${DEMANDE_CODE}"
fi

if [ "${HOME_CODE}" != "200" ]; then
  echo "Smoke failed: app is not healthy."
  exit 1
fi

echo "Smoke checks passed."
