#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "Missing DIRECT_URL."
  exit 1
fi

echo "Checking critical tables on Supabase..."
psql "${DIRECT_URL}" -v ON_ERROR_STOP=1 <<'SQL'
\echo --- table counts ---
select 'User' as table_name, count(*) from "User"
union all
select 'Session' as table_name, count(*) from "Session"
union all
select 'VerificationToken' as table_name, count(*) from "VerificationToken"
union all
select 'DemandeCompte' as table_name, count(*) from "DemandeCompte";
SQL

echo "Checks completed."
