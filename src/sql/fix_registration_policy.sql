-- Policy to allow users to insert their OWN profile upon registration
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Policy to allow users to view their OWN profile
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

-- Policy to allow users to update their OWN profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Optional: Allow Everyone to read profiles (if public profiles are needed)
-- create policy "Public profiles are viewable by everyone"
--   on profiles for select
--   using ( true );

-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor.
-- 2. This will allow new users to successfully register and create their profile record.
