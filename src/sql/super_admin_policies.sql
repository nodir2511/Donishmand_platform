-- 1. Enable RLS on profiles if not already enabled (it should be)
alter table profiles enable row level security;

-- 2. Policy to allow Super Admins to view all profiles
create policy "Super Admins can view all profiles"
  on profiles for select
  using (
    auth.uid() in (
      select id from profiles where role = 'super_admin'
    )
  );

-- 3. Policy to allow Super Admins to update any profile (to change roles)
create policy "Super Admins can update any profile"
  on profiles for update
  using (
    auth.uid() in (
      select id from profiles where role = 'super_admin'
    )
  );

-- INSTRUCTIONS:
-- 1. Run this script in the Supabase SQL Editor.
-- 2. To make yourself a super_admin, run this command (replace YOUR_EMAIL with your actual email):
-- update profiles set role = 'super_admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
