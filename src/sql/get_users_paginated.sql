-- Function to get users with pagination and search
-- Returns total_count for frontend pagination calculation

create or replace function get_users_paginated(
  page_number int,
  page_size int,
  search_query text default ''
)
returns table (
  id uuid,
  email varchar,
  role varchar,
  full_name varchar,
  avatar_url text, -- Changed to text to match typical supabase types, though varchar is fine
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  offset_val int;
begin
  offset_val := (page_number - 1) * page_size;

  return query
  with filtered_users as (
    select
      p.id,
      p.email,
      p.role,
      p.full_name,
      p.avatar_url,
      p.created_at
    from public.profiles p
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
    (select count(*) from filtered_users)::bigint as total_count
  from filtered_users f
  order by f.created_at desc
  limit page_size
  offset offset_val;
end;
$$;
