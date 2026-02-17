-- ============================================================
-- МИГРАЦИЯ: Система ролей и прав доступа
-- Выполнить в Supabase SQL Editor ЦЕЛИКОМ
-- Дата: 17.02.2026
-- ============================================================

-- ШАГ 1: Добавить cluster_id в profiles (кластер обучения ученика)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cluster_id integer;

-- ШАГ 2: Создать таблицу прав на редактирование предметов
-- ============================================================
CREATE TABLE IF NOT EXISTS subject_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id text NOT NULL,
    can_edit boolean DEFAULT false,
    granted_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, subject_id)
);

-- ШАГ 3: Включить RLS на subject_permissions
-- ============================================================
ALTER TABLE subject_permissions ENABLE ROW LEVEL SECURITY;

-- ШАГ 4: Создать функцию is_admin_or_above (без рекурсии)
-- ============================================================
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

-- ШАГ 5: RLS-политики для subject_permissions
-- ============================================================

-- Админы и суперадмины могут просматривать все права
CREATE POLICY "Admins can view all permissions" 
  ON subject_permissions FOR SELECT
  USING ( is_admin_or_above() );

-- Учитель может видеть только свои права
CREATE POLICY "Teachers can view own permissions" 
  ON subject_permissions FOR SELECT
  USING ( auth.uid() = user_id );

-- Админы и суперадмины могут добавлять права
CREATE POLICY "Admins can insert permissions" 
  ON subject_permissions FOR INSERT
  WITH CHECK ( is_admin_or_above() );

-- Админы и суперадмины могут обновлять права
CREATE POLICY "Admins can update permissions" 
  ON subject_permissions FOR UPDATE
  USING ( is_admin_or_above() );

-- Админы и суперадмины могут удалять права
CREATE POLICY "Admins can delete permissions" 
  ON subject_permissions FOR DELETE
  USING ( is_admin_or_above() );

-- ШАГ 6: Обновить RLS-политики profiles — админ тоже может видеть и обновлять
-- ============================================================

-- Удалить старые политики суперадмина (мы их расширяем)
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;

-- Создаём новые политики: admin + super_admin
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
  USING ( is_admin_or_above() );

CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE
  USING ( is_admin_or_above() );

-- Админы могут вставлять профили (для создания пользователей)
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT
  WITH CHECK ( is_admin_or_above() );

-- ГОТОВО! Теперь:
-- 1. profiles имеет cluster_id для привязки ученика к кластеру
-- 2. subject_permissions хранит права учителей на редактирование предметов
-- 3. Админы и суперадмины могут управлять правами и профилями
