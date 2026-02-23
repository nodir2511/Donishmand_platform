-- ============================================================
-- ОБНОВЛЕНИЕ: get_users_paginated с email_confirmed_at
-- Выполнить в Supabase SQL Editor ЦЕЛИКОМ
-- Дата обновления: 23.02.2026
-- ============================================================
-- Добавлено поле email_confirmed_at из auth.users для отображения
-- статуса подтверждения email в админ-панели.

-- Удаляем старую версию (изменился набор возвращаемых полей)
DROP FUNCTION IF EXISTS get_users_paginated(int, int, text);

create or replace function get_users_paginated(
  page_number int,
  items_per_page int,
  search_query text default ''
)
returns table (
  id uuid,
  email text,
  role text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  selected_subjects text[],
  subject text,
  grade integer,
  language text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  offset_val int;
begin
  offset_val := (page_number - 1) * items_per_page;

  return query
  with filtered_users as (
    select
      p.id,
      p.email,
      p.role,
      p.full_name,
      p.avatar_url,
      au.created_at,
      au.email_confirmed_at,
      p.selected_subjects,
      p.subject,
      p.grade,
      p.language
    from public.profiles p
    left join auth.users au on au.id = p.id
    where
      (search_query is null or search_query = '' or
       p.email ilike '%' || search_query || '%' or
       p.full_name ilike '%' || search_query || '%')
  )
  select
    f.id,
    f.email,
    f.role,
    f.full_name,
    f.avatar_url,
    f.created_at,
    f.email_confirmed_at,
    f.selected_subjects,
    f.subject,
    f.grade,
    f.language,
    (select count(*) from filtered_users)::bigint as total_count
  from filtered_users f
  order by f.created_at desc
  limit items_per_page
  offset offset_val;
end;
$$;
