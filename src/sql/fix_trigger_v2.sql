-- ============================================================
-- SQL Script: Fix Profiles Table and Registration Trigger
-- Run this in the Supabase SQL Editor (postgres role)
-- ============================================================

-- 1. Ensure the 'selected_subjects' column exists and has a default value
-- This is the most likely cause if it was added as NOT NULL without a default.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_subjects text[] DEFAULT '{}';

-- 2. Ensure and update other defaults for safety
ALTER TABLE public.profiles ALTER COLUMN language SET DEFAULT 'tj';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';

-- 3. Update the handle_new_user trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- We use INSERT ... ON CONFLICT to prevent errors if the profile already exists.
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    email, 
    updated_at,
    selected_subjects, -- Include the new field
    language
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email,
    NOW(),
    '{}',              -- Default empty array for subjects
    COALESCE(NEW.raw_user_meta_data->>'language', 'tj')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-verify the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done!
