-- ============================================================
-- FIX: Ограничение роли при самостоятельной регистрации
-- Дата: 2026-03-08
-- ============================================================
-- Проблема: Пользователь мог передать role='teacher' через
-- raw_user_meta_data при signUp(), и триггер handle_new_user()
-- слепо записывал эту роль в profiles.
--
-- Решение: Триггер теперь ВСЕГДА записывает role='student'
-- при создании через auth.users. Роль teacher/admin/super_admin
-- может быть назначена только через admin_upsert_profile()
-- или update_user_role() (вызываются из AdminPage).
-- ============================================================

-- 1. Обновляем триггер — роль всегда student при самостоятельной регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'student',  -- Роль ВСЕГДА student при самостоятельной регистрации
    NEW.email,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Добавляем RLS-политику запрещающую менять роль через UPDATE
-- Пользователь может обновлять свой профиль, но НЕ поле role
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK (
    -- Если роль менялась — проверяем, что она не была повышена
    -- (пользователь не может сам назначить себе teacher/admin/super_admin)
    role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    OR role = 'student'
  );

-- ============================================================
-- FINISH: Теперь при самостоятельной регистрации пользователь
-- ВСЕГДА получает role='student', а повысить роль может
-- ТОЛЬКО администратор через RPC.
-- ============================================================
