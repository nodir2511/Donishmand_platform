-- ============================================================
-- СКРИПТ ИСПРАВЛЕНИЯ ПРОФИЛЕЙ
-- Выполнить в Supabase SQL Editor
-- ============================================================

-- ШАГ 1: Добавить недостающие столбцы в таблицу profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'tj';

-- ШАГ 2: Создать функцию для автоматического создания профиля
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ШАГ 3: Привязать триггер к таблице auth.users
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ШАГ 4: Создать профили для уже зарегистрированных пользователей (без профиля)
-- ============================================================
INSERT INTO public.profiles (id, full_name, role, updated_at)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'student', NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- ШАГ 5: Убедиться что RLS включен и политики на месте
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Удалить старые политики (если есть) чтобы пересоздать чисто
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Политика INSERT: пользователь может создать только свой профиль
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Политика SELECT: пользователь может видеть свой профиль
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ( auth.uid() = id );

-- Политика UPDATE: пользователь может обновлять свой профиль
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- ГОТОВО! Теперь при регистрации профиль создаётся автоматически.
