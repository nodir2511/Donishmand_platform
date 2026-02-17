-- ============================================================
-- ОБНОВЛЕНИЕ ФУНКЦИИ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ
-- Добавляем поддержку полей subject, grade, language
-- ============================================================

-- Удаляем старую версию (на всякий случай, если сигнатура не изменится, 
-- но лучше использовать CREATE OR REPLACE, однако если мы меняем типы аргументов, иногда нужно удалять явно)
-- В данном случае мы добавляем аргументы, поэтому старая версия (с 3 аргументами) и новая (с 6 аргументами)
-- могут сосуществовать как перегрузки. Но мы хотим использовать только новую.
-- Чтобы избежать путаницы, лучше удалить старую, но DROP FUNCTION admin_upsert_profile(uuid, text, text); может вызвать ошибку если ее нет.

CREATE OR REPLACE FUNCTION admin_upsert_profile(
  target_id uuid, 
  target_full_name text, 
  target_role text,
  target_subject text DEFAULT NULL,
  target_grade integer DEFAULT NULL,
  target_language text DEFAULT 'ru'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- 1. Проверяем, кто вызывает функцию
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Недостаточно прав';
  END IF;
  
  -- 2. Вставляем или обновляем профиль
  INSERT INTO profiles (id, full_name, role, subject, grade, language, updated_at)
  VALUES (target_id, target_full_name, target_role, target_subject, target_grade, target_language, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    subject = EXCLUDED.subject,
    grade = EXCLUDED.grade,
    language = EXCLUDED.language,
    updated_at = now();
END;
$$;
