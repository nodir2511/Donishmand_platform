-- Add subject column to profiles table
alter table profiles 
add column if not exists subject text;

-- Instructions:
-- Run this script in Supabase SQL Editor to update the profiles table.
