-- ============================================================
-- ДОБАВЛЕНИЕ RPC-ФУНКЦИИ ДЛЯ ЗАГРУЗКИ ПРОФИЛЯ
-- Выполнить в Supabase SQL Editor
-- ============================================================

-- Функция для получения СВОЕГО профиля (обходит RLS)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

-- Дать доступ к функции для authenticated пользователей
GRANT EXECUTE ON FUNCTION get_my_profile() TO authenticated;
