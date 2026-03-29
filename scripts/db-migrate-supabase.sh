#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Missing DATABASE_URL."
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "Missing DIRECT_URL."
  exit 1
fi

echo "Running Prisma migrations against Supabase..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Migration and generate completed."
