-- ============================================================
-- FINAL FIX FOR USER CREATION (500 Error)
-- Выполните в Supabase SQL Editor
-- ============================================================

-- 1. Убеждаемся, что колонка 'email' существует (именно её отсутствие вызывало ошибку 500)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Убеждаемся, что 'selected_subjects' существует
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_subjects text[] DEFAULT '{}';

-- 3. Убеждаемся, что 'language' существует
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'tj';

-- 4. Пересоздаем и исправляем триггер
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    email, 
    updated_at,
    selected_subjects,
    language
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email,
    NOW(),
    ARRAY[]::text[],
    COALESCE(NEW.raw_user_meta_data->>'language', 'tj')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Привязываем триггер (пересоздаем на всякий случай)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ГОТОВО!
