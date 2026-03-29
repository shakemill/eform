#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${LOCAL_DATABASE_URL:-}" ]; then
  echo "Missing LOCAL_DATABASE_URL. Example:"
  echo 'LOCAL_DATABASE_URL="postgresql://user:pass@localhost:5432/eform?schema=public" npm run db:export:local'
  exit 1
fi

mkdir -p ./.tmp
OUT_FILE="./.tmp/local-eform.dump"
CONN="${LOCAL_DATABASE_URL%%\?*}"

echo "Exporting local database to ${OUT_FILE}..."
pg_dump "${CONN}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "${OUT_FILE}"

echo "Done: ${OUT_FILE}"
