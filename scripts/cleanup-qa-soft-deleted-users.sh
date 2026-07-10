#!/usr/bin/env bash
set -euo pipefail

apply=false
if [ "${1:-}" = "--apply" ]; then
  apply=true
elif [ "${1:-}" != "" ]; then
  echo "Usage: $0 [--apply]"
  exit 2
fi

if ! docker ps --format '{{.Names}}' | grep -qx 'matrixapi-db'; then
  echo "matrixapi-db container is not running"
  exit 1
fi

tmp_sql="$(mktemp)"
trap 'rm -f "$tmp_sql"' EXIT

if [ "$apply" = true ]; then
  cat >"$tmp_sql" <<'SQL'
\set ON_ERROR_STOP on

begin;

create temporary table matrixapi_qa_soft_deleted_users as
select id, username, deleted_at
from users
where username like 'qu\_%' escape '\'
  and deleted_at is not null;

select id, username, deleted_at
from matrixapi_qa_soft_deleted_users
order by id;

select count(*) as candidate_count
from matrixapi_qa_soft_deleted_users;

do $$
declare
  unsafe_count integer;
begin
  select count(*)
  into unsafe_count
  from matrixapi_qa_soft_deleted_users
  where username not like 'qu\_%' escape '\'
     or deleted_at is null;

  if unsafe_count <> 0 then
    raise exception 'Refusing cleanup: candidate set contains non-QA or active users';
  end if;
end $$;

delete from users
where id in (select id from matrixapi_qa_soft_deleted_users);

select count(*) as remaining_qa_soft_deleted_users
from users
where username like 'qu\_%' escape '\'
  and deleted_at is not null;

commit;
SQL
else
  cat >"$tmp_sql" <<'SQL'
\set ON_ERROR_STOP on

select id, username, deleted_at
from users
where username like 'qu\_%' escape '\'
  and deleted_at is not null
order by id;

select count(*) as candidate_count
from users
where username like 'qu\_%' escape '\'
  and deleted_at is not null;
SQL
fi

docker exec -i matrixapi-db psql -U matrixapi -d new_api <"$tmp_sql"

if [ "$apply" = true ]; then
  echo "Applied cleanup for soft-deleted MatrixAPI QA users."
else
  echo "Dry run only. Re-run with --apply to delete these soft-deleted QA users."
fi
