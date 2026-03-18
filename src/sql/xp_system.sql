-- ========================================================================================
-- DONISHMAND PLATFORM: XP & LEVEL SYSTEM MIGRATION
-- ========================================================================================

-- 1. ОБНОВЛЕНИЕ ТАБЛИЦЫ ПРОФИЛЕЙ
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS total_xp BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 2. ТАБЛИЦА ИСТОРИИ XP
CREATE TABLE IF NOT EXISTS public.xp_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    subject_id TEXT,
    lesson_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Политики RLS
DROP POLICY IF EXISTS "Users can view own xp history" ON public.xp_history;
CREATE POLICY "Users can view own xp history" ON public.xp_history FOR SELECT USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins can view all xp history" ON public.xp_history;
CREATE POLICY "Admins can view all xp history" ON public.xp_history FOR SELECT USING ( public.is_admin_or_above() );

-- 3. ФУНКЦИЯ РАСЧЕТА УРОВНЯ
-- Формула: XP = 750 * L * (L - 1)
-- Обратная формула для L: L = (1 + sqrt(1 + 8 * XP / 750)) / 2
CREATE OR REPLACE FUNCTION public.calculate_user_level(p_xp BIGINT)
RETURNS INTEGER AS $$
BEGIN
    IF p_xp < 1500 THEN RETURN 1; END IF;
    RETURN FLOOR((1 + SQRT(1 + 8 * p_xp::NUMERIC / 750.0)) / 2.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. RPC: НАЧИСЛЕНИЕ XP
CREATE OR REPLACE FUNCTION public.grant_xp(
    p_amount INTEGER,
    p_reason TEXT,
    p_subject_id TEXT DEFAULT NULL,
    p_lesson_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_new_xp BIGINT;
    v_old_level INTEGER;
    v_new_level INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Получаем текущие данные
    SELECT COALESCE(total_xp, 0) INTO v_old_level FROM public.profiles WHERE id = v_user_id;
    v_old_level := public.calculate_user_level(v_old_level::BIGINT);

    -- Добавляем в историю
    INSERT INTO public.xp_history (user_id, amount, reason, subject_id, lesson_id)
    VALUES (v_user_id, p_amount, p_reason, p_subject_id, p_lesson_id);

    -- Обновляем профиль
    UPDATE public.profiles 
    SET total_xp = total_xp + p_amount,
        updated_at = now()
    WHERE id = v_user_id
    RETURNING total_xp INTO v_new_xp;

    v_new_level := public.calculate_user_level(v_new_xp);

    RETURN jsonb_build_object(
        'xp_granted', p_amount,
        'total_xp', v_new_xp,
        'current_level', v_new_level,
        'leveled_up', v_new_level > v_old_level
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_xp(INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- 5. RPC: ОБНОВЛЕНИЕ СТРИКА (СЕРИИ ДНЕЙ)
CREATE OR REPLACE FUNCTION public.refresh_user_streak()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_today DATE;
    v_last_date DATE;
    v_current_streak INTEGER;
    v_xp_bonus INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN NULL; END IF;
    
    v_today := CURRENT_DATE;
    
    SELECT last_activity_date, streak_count 
    INTO v_last_date, v_current_streak 
    FROM public.profiles 
    WHERE id = v_user_id;

    -- Если сегодня уже заходил - ничего не делаем
    IF v_last_date = v_today THEN
        RETURN jsonb_build_object('streak', v_current_streak, 'bonus_granted', 0);
    END IF;

    -- Если заходил вчера - продолжаем стрик
    IF v_last_date = v_today - 1 THEN
        v_current_streak := v_current_streak + 1;
        v_xp_bonus := 50 * v_current_streak;
        IF v_xp_bonus > 250 THEN v_xp_bonus := 250; END IF; -- Максимальный бонус по плану
    ELSE
        -- Стрик прерван или это первый раз
        v_current_streak := 1;
        v_xp_bonus := 50;
    END IF;

    -- Обновляем профиль
    UPDATE public.profiles 
    SET streak_count = v_current_streak,
        last_activity_date = v_today,
        total_xp = total_xp + v_xp_bonus,
        updated_at = now()
    WHERE id = v_user_id;

    -- Записываем бонус в историю XP
    INSERT INTO public.xp_history (user_id, amount, reason)
    VALUES (v_user_id, v_xp_bonus, 'daily_streak');

    RETURN jsonb_build_object(
        'streak', v_current_streak,
        'xp_bonus', v_xp_bonus,
        'message', 'Daily streak updated!'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_user_streak() TO authenticated;
