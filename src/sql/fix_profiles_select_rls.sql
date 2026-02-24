-- Исправление RLS для таблицы profiles
-- Чтобы учителя и другие ученики могли видеть имена друг друга 
-- (иначе в статистике и списке класса выводит "Неизвестный ученик")

-- Разрешаем всем авторизованным пользователям читать таблицу profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

CREATE POLICY "Authenticated users can view all profiles" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);
