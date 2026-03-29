#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "Missing DIRECT_URL (Supabase direct postgres connection)."
  exit 1
fi

IN_FILE="${1:-./.tmp/local-eform.dump}"
if [ ! -f "${IN_FILE}" ]; then
  echo "Dump file not found: ${IN_FILE}"
  echo "Run export first: npm run db:export:local"
  exit 1
fi

echo "Importing ${IN_FILE} into Supabase (DIRECT_URL)..."
pg_restore "${IN_FILE}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname "${DIRECT_URL}"

echo "Import completed."
