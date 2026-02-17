-- ============================================================
-- ПОЛНЫЙ СБРОС И ПЕРЕСОЗДАНИЕ RLS-ПОЛИТИК ДЛЯ profiles
-- Выполнить в Supabase SQL Editor ЦЕЛИКОМ
-- ============================================================

-- ШАГ 1: Удаляем ВСЕ существующие политики
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Insert profiles" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ШАГ 2: Пересоздаём функцию is_super_admin (plpgsql, не SQL!)
-- plpgsql НЕ инлайнится, SECURITY DEFINER обходит RLS
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ШАГ 3: Убеждаемся что RLS включён
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ШАГ 4: Создаём чистые политики
-- SELECT: пользователь может видеть свой профиль
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING ( auth.uid() = id );

-- INSERT: пользователь может создать свой профиль
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- UPDATE: пользователь может обновлять свой профиль
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- SELECT: супер-админ может видеть ВСЕ профили
CREATE POLICY "Super admins can view all profiles" ON profiles FOR SELECT
  USING ( is_super_admin() );

-- UPDATE: супер-админ может обновлять ВСЕ профили
CREATE POLICY "Super admins can update all profiles" ON profiles FOR UPDATE
  USING ( is_super_admin() );

-- ГОТОВО!
