-- ============================================================
-- МИГРАЦИЯ: Подтверждение email пользователя администратором
-- Выполнить в Supabase SQL Editor ЦЕЛИКОМ
-- Дата: 23.02.2026
-- ============================================================

-- RPC-функция для подтверждения email пользователя.
-- Только админы и суперадмины могут вызвать.
-- Устанавливает email_confirmed_at в auth.users, минуя необходимость
-- перехода по ссылке из письма.

CREATE OR REPLACE FUNCTION admin_confirm_user_email(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Проверка прав: только admin и super_admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Недостаточно прав для подтверждения email';
  END IF;

  -- Устанавливаем email_confirmed_at = сейчас
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = target_user_id
    AND email_confirmed_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_confirm_user_email(uuid) TO authenticated;

-- ГОТОВО! Теперь админы могут подтверждать email через:
-- SELECT admin_confirm_user_email('user-uuid-here');
-- Или через фронтенд: supabase.rpc('admin_confirm_user_email', { target_user_id: '...' })
