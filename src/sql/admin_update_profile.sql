-- ============================================================
-- SQL Script: Admin Update Profile
-- ============================================================

CREATE OR REPLACE FUNCTION admin_update_profile(
  target_id uuid,
  new_full_name text,
  new_role text,
  new_subject text DEFAULT NULL,
  new_grade integer DEFAULT NULL,
  new_language text DEFAULT 'tj'
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

  -- 2. Обновляем профиль
  UPDATE profiles 
  SET 
    full_name = new_full_name,
    role = new_role,
    subject = new_subject,
    grade = new_grade,
    language = new_language,
    updated_at = now()
  WHERE id = target_id;
  
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_profile(uuid, text, text, text, integer, text) TO authenticated;
