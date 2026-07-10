select column_name
from information_schema.columns
where table_name = 'users' and lower(column_name) like '%deleted%'
order by ordinal_position;

select id, username, status, role,
       case when deleted_at is null then 'active' else 'deleted' end as deleted_state
from users
where username like 'qu\_%' escape '\'
order by id;

select count(*) as qa_soft_deleted_count
from users
where username like 'qu\_%' escape '\' and deleted_at is not null;
