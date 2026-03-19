-- ========================================================================================
-- DONISHMAND PLATFORM: NOTIFICATIONS & ANNOUNCEMENTS SYSTEM
-- ========================================================================================

-- 1. NOTIFICATIONS (Персональные уведомления)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- 'test_checked', 'new_lesson', 'achievement', 'admin', 'system'
    title_ru text NOT NULL,
    title_tj text NOT NULL,
    message_ru text,
    message_tj text,
    is_read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 2. ANNOUNCEMENTS (Глобальные и групповые анонсы)
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL DEFAULT 'global', -- 'global', 'class', 'branch'
    target_id uuid, -- NULL для global, ID класса или филиала
    title_ru text NOT NULL,
    title_tj text NOT NULL,
    content_ru text NOT NULL,
    content_tj text NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 3. RLS ПОЛИТИКИ (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Очистка старых политик если есть
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Пользователь видит только свои уведомления
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Пользователь может помечать свои уведомления как прочитанные
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Анонсы видны всем (фильтрация по target_id будет на стороне API или в WHERE)
CREATE POLICY "Everyone can view active announcements" ON public.announcements
    FOR SELECT USING (expires_at IS NULL OR expires_at > now());

-- Только админы могут создавать/удалять анонсы
CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (public.is_teacher_or_above()); -- Учителя тоже могут писать анонсы своим классам

-- 4. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read, user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements(type, target_id);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);

-- 5. ФУНКЦИЯ ДЛЯ УДОБНОЙ ОТПРАВКИ УВЕДОМЛЕНИЙ (RPC)
CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id uuid,
    p_type text,
    p_title_ru text,
    p_title_tj text,
    p_message_ru text DEFAULT NULL,
    p_message_tj text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO public.notifications (user_id, type, title_ru, title_tj, message_ru, message_tj, metadata)
    VALUES (p_user_id, p_type, p_title_ru, p_title_tj, p_message_ru, p_message_tj, p_metadata)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_notification TO authenticated;
