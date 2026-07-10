#!/usr/bin/env bash
set -euo pipefail

ADMIN_USERNAME="${NEW_API_ADMIN_USERNAME:-${ADMIN_USERNAME:-}}"

if [ -z "$ADMIN_USERNAME" ]; then
  echo "NEW_API_ADMIN_USERNAME or ADMIN_USERNAME is required"
  exit 1
fi

tmp_sql="$(mktemp)"
trap 'rm -f "$tmp_sql"' EXIT

cat > "$tmp_sql" <<'SQL'
\set ON_ERROR_STOP on

select exists(select 1 from users where username = :'admin_username') as admin_user_exists
\gset

\if :admin_user_exists
\else
  \echo 'Configured admin user does not exist. Create it through New API registration first, then rerun this script.'
  \quit 1
\endif

update users
set role = 100,
    status = 1
where username = :'admin_username';
SQL

docker cp "$tmp_sql" matrixapi-db:/tmp/ensure-new-api-admin-db.sql
docker exec \
  -e NEW_API_ADMIN_USERNAME="$ADMIN_USERNAME" \
  matrixapi-db sh -lc '
    psql -U matrixapi -d new_api \
      -v admin_username="$NEW_API_ADMIN_USERNAME" \
      -f /tmp/ensure-new-api-admin-db.sql
  '

echo "MatrixAPI admin account role/status ensured."
