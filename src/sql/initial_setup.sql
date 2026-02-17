-- ============================================================
-- MASTER SETUP SCRIPT: Donishmand Platform
-- ============================================================
-- Этот скрипт объединяет все необходимые настройки базы данных:
-- 1. Таблицы (profiles, subject_permissions)
-- 2. Триггеры (создание профиля при регистрации)
-- 3. Функции RPC (для админ-панели и обхода RLS)
-- 4. Политики безопасности (RLS) без рекурсии
-- ============================================================

-- 1. Таблица PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'super_admin', 'user')),
  -- Дополнительные поля
  email text,
  birth_date date,
  phone text,
  school text,
  grade integer,
  branch text,
  group_name text,
  subject text,
  language text DEFAULT 'tj',
  cluster_id integer
);

-- Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Таблица SUBJECT_PERMISSIONS (права учителей)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subject_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id text NOT NULL,
    can_edit boolean DEFAULT false,
    granted_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, subject_id)
);

ALTER TABLE public.subject_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Триггер для автоматического создания профиля
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздаем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Вспомогательные функции (RPC)
-- ============================================================

-- Проверка прав (админ или выше) без рекурсии
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Получение всех профилей (для AdminPage) - обходит RLS
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles ORDER BY updated_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated;

-- Получение своего профиля (безопасный метод)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_my_profile() TO authenticated;

-- Обновление роли (только для админов)
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

-- Создание профиля админом (Create User)
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

-- 5. Политики безопасности (RLS)
-- ============================================================

-- СБРОС СТАРЫХ ПОЛИТИК (чтобы избежать конфликтов)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('profiles', 'subject_permissions') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Policies for PROFILES
-- -------------------
-- Каждый видит свой профиль
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING ( auth.uid() = id );

-- Каждый может редактировать свой профиль
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Каждый может создать свой профиль (если триггер не сработал)
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Policies for SUBJECT_PERMISSIONS
-- ------------------------------
-- Учителя видят свои права
CREATE POLICY "Teachers can view own permissions" ON subject_permissions FOR SELECT
  USING ( auth.uid() = user_id );

-- Админы видят все права (используем security definer функцию, чтобы избежать рекурсии если бы читали profiles напрямую с RLS)
CREATE POLICY "Admins can view all permissions" ON subject_permissions FOR SELECT
  USING ( is_admin_or_above() );

-- Админы могут управлять правами
CREATE POLICY "Admins can insert permissions" ON subject_permissions FOR INSERT
  WITH CHECK ( is_admin_or_above() );

CREATE POLICY "Admins can update permissions" ON subject_permissions FOR UPDATE
  USING ( is_admin_or_above() );

CREATE POLICY "Admins can delete permissions" ON subject_permissions FOR DELETE
  USING ( is_admin_or_above() );

-- ============================================================
-- FINISH
-- ============================================================
