-- ============================================================
-- ФИНАЛЬНЫЙ ФИКС RLS: Убираем циклическую зависимость
-- Выполнить в Supabase SQL Editor (Role: postgres)
-- ============================================================

-- ШАГ 1: УДАЛИТЬ ВСЕ политики на profiles (чистый старт)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
        RAISE NOTICE 'Удалена: %', pol.policyname;
    END LOOP;
END $$;

-- ШАГ 2: Создать ПРОСТЫЕ политики БЕЗ вызова функций
-- Пользователь видит СВОЙ профиль
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING ( auth.uid() = id );

-- Пользователь обновляет СВОЙ профиль
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Пользователь может вставить СВОЙ профиль (регистрация)
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- ШАГ 3: Создать RPC-функцию для AdminPage (SECURITY DEFINER = обход RLS)
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles ORDER BY updated_at DESC NULLS LAST;
$$;

-- Дать доступ к функции для authenticated пользователей
GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated;

-- ШАГ 4: Функция для обновления роли (SECURITY DEFINER = обход RLS)
CREATE OR REPLACE FUNCTION update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Недостаточно прав для смены роли';
  END IF;
  
  -- Обычный admin не может назначить admin/super_admin
  IF caller_role = 'admin' AND new_role IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Только super_admin может назначать админские роли';
  END IF;
  
  UPDATE profiles SET role = new_role, updated_at = now() WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;

-- ШАГ 5: Функция для upsert профиля (создание пользователей из AdminPage)
CREATE OR REPLACE FUNCTION admin_upsert_profile(
  target_id uuid, 
  target_full_name text, 
  target_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Недостаточно прав';
  END IF;
  
  INSERT INTO profiles (id, full_name, role, updated_at)
  VALUES (target_id, target_full_name, target_role, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION admin_upsert_profile(uuid, text, text) TO authenticated;

-- ШАГ 6: Убедиться что RLS включен
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ПРОВЕРКА:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
-- Должно быть 3 политики: Users can view/update/insert own profile
