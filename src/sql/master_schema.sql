-- ========================================================================================
-- DONISHMAND PLATFORM: MASTER SQL SCHEMA (Consolidated)
-- ========================================================================================
-- Инструкция: Данный скрипт содержит всю актуальную схему, функции, триггеры и политики RLS
-- для успешного развертывания или сброса базы данных проекта в Supabase SQL Editor.
-- ========================================================================================

-- ========================================================================================
-- 1. СОЗДАНИЕ ТАБЛИЦ (TABLES)
-- ========================================================================================

-- 1.1 PROFILES (Профили пользователей)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz DEFAULT now(),
  full_name text DEFAULT '',
  avatar_url text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'super_admin', 'user')),
  email text,
  birth_date date,
  phone text,
  school text,
  grade integer,
  branch text,
  group_name text,
  subject text,
  language text DEFAULT 'tj',
  cluster_id integer,
  selected_subjects text[] DEFAULT '{}',
  fast_q_count integer DEFAULT 0
);

-- 1.2 BRANCHES (Филиалы)
CREATE TABLE IF NOT EXISTS public.branches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- 1.3 CLASSES (Классы/Группы)
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject text NOT NULL,
    grade integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
    invite_code text UNIQUE,
    description text,
    subject_id text
);

-- 1.4 CLASS_TEACHERS (Со-преподаватели классов)
CREATE TABLE IF NOT EXISTS public.class_teachers (
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    added_at timestamptz DEFAULT now(),
    PRIMARY KEY (class_id, teacher_id)
);

-- 1.5 CLASS_MEMBERS (Ученики в классах)
CREATE TABLE IF NOT EXISTS public.class_members (
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now(),
    PRIMARY KEY (class_id, student_id)
);

-- 1.6 SUBJECT_PERMISSIONS (Права учителей на предметы)
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

-- 1.7 USER_LESSON_PROGRESS (Прогресс прохождения уроков)
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id text NOT NULL,
    video_watched boolean DEFAULT false,
    text_read boolean DEFAULT false,
    slides_viewed_count integer DEFAULT 0,
    total_slides integer DEFAULT 0,
    study_time_seconds integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- 1.8 USER_TEST_RESULTS (Результаты тестов)
CREATE TABLE IF NOT EXISTS public.user_test_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id text NOT NULL,
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    correct_count integer NOT NULL DEFAULT 0,
    total_questions integer NOT NULL DEFAULT 0,
    is_passed boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    answers_detail jsonb DEFAULT '[]'::jsonb,
    time_spent_seconds integer DEFAULT 0
);

-- 1.9 COIN_TRANSACTIONS (Монеты / Игровая валюта)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL DEFAULT 0,
    reason text DEFAULT 'test_passed',
    subject_id text,
    lesson_id text,
    created_at timestamptz DEFAULT now()
);

-- 1.10 TOPIC_GRADES (Итоговые оценки за тему)
CREATE TABLE IF NOT EXISTS public.topic_grades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    topic_id text NOT NULL,
    system_grade numeric,
    teacher_grade text,
    review_grade numeric,
    comment text,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(student_id, class_id, topic_id)
);

-- 1.11 NOTIFICATIONS (Персональные уведомления)
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

-- 1.12 ANNOUNCEMENTS (Глобальные и групповые анонсы)
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


-- ========================================================================================
-- 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ БЕЗОПАСНОСТИ (RPC)
-- ========================================================================================

-- Проверка: Админ или Суперадмин (обходит RLS)
CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.3 Функция отправки уведомлений (RPC)
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

-- Проверка: Суперадмин (обходит RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Проверка: Учитель, Админ или Суперадмин (обходит RLS)
CREATE OR REPLACE FUNCTION public.is_teacher_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('teacher', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ========================================================================================
-- 3. ТРИГГЕР: АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПРОФИЛЯ ПРИ РЕГИСТРАЦИИ
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    email, 
    updated_at,
    selected_subjects,
    language
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'student', -- Саморегистрация ВСЕГДА дает роль student (защита от взлома через meta_data)
    NEW.email,
    NOW(),
    ARRAY[]::text[],
    COALESCE(NEW.raw_user_meta_data->>'language', 'tj')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ========================================================================================
-- 4. RPC ФУНКЦИИ (ДЛЯ КЛИЕНТА И АДМИН ПАНЕЛИ)
-- ========================================================================================

-- 4.1 Получение СВОЕГО профиля (обход RLS)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 4.2 Получение ВСЕХ профилей (для AdminPage, обход RLS)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles ORDER BY updated_at DESC NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;

-- 4.3 Обновление роли (только для админов)
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Недостаточно прав для смены роли'; END IF;
  IF caller_role = 'admin' AND new_role IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Только super_admin может назначать админские роли'; END IF;
  UPDATE public.profiles SET role = new_role, updated_at = now() WHERE id = target_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO authenticated;

-- 4.4 Создание профиля админом (из AdminPage)
CREATE OR REPLACE FUNCTION public.admin_upsert_profile(
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
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Недостаточно прав'; END IF;
  
  INSERT INTO public.profiles (id, full_name, role, subject, grade, language, updated_at)
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
GRANT EXECUTE ON FUNCTION public.admin_upsert_profile(uuid, text, text, text, integer, text) TO authenticated;

-- 4.5 Обновление профиля админом (из AdminPage)
CREATE OR REPLACE FUNCTION public.admin_update_profile(
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
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Недостаточно прав'; END IF;

  UPDATE public.profiles 
  SET full_name = new_full_name, role = new_role, subject = new_subject, grade = new_grade, language = new_language, updated_at = now()
  WHERE id = target_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text, text, integer, text) TO authenticated;

-- 4.6 Ручное подтверждение email админом
CREATE OR REPLACE FUNCTION public.admin_confirm_user_email(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Недостаточно прав'; END IF;

  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = target_user_id AND email_confirmed_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_confirm_user_email(uuid) TO authenticated;

-- 4.6.1 Полное удаление пользователя и всех связанных данных (RPC для Super Admin)
-- 4.6.1 Полное удаление пользователя и всех связанных данных (RPC для Super Admin)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Только super_admin может удалять пользователей
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('super_admin') THEN 
    RAISE EXCEPTION 'Только Супер-Администратор может удалять пользователей'; 
  END IF;

  -- Ручное удаление зависимостей (на случай, если в БД не настроен ON DELETE CASCADE)
  DELETE FROM public.coin_transactions WHERE user_id = target_user_id;
  DELETE FROM public.user_test_results WHERE user_id = target_user_id;
  DELETE FROM public.user_lesson_progress WHERE user_id = target_user_id;
  DELETE FROM public.subject_permissions WHERE user_id = target_user_id OR granted_by = target_user_id;
  DELETE FROM public.class_members WHERE student_id = target_user_id;
  DELETE FROM public.class_teachers WHERE teacher_id = target_user_id;
  DELETE FROM public.classes WHERE teacher_id = target_user_id;
  DELETE FROM public.topic_grades WHERE student_id = target_user_id;

  -- Удаляем сам профиль
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Удаляем идентификаторы auth-схемы
  DELETE FROM auth.identities WHERE user_id = target_user_id;
  DELETE FROM auth.sessions WHERE user_id = target_user_id;

  -- Удаляем из корневой таблицы
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
-- Права на вызов
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
-- ВОТ КЛЮЧЕВОЕ РЕШЕНИЕ ПРОТИВ 403 (FORBIDDEN) ПРИ УДАЛЕНИИ AUTH.USERS
ALTER FUNCTION public.admin_delete_user(uuid) OWNER TO postgres;

-- 4.7 Пагинация списка пользователей (со статусом confirmed)
DROP FUNCTION IF EXISTS public.get_users_paginated(int, int, text);
CREATE OR REPLACE FUNCTION public.get_users_paginated(
  page_number int,
  items_per_page int,
  search_query text default ''
)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  selected_subjects text[],
  subject text,
  grade integer,
  language text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offset_val int;
BEGIN
  offset_val := (page_number - 1) * items_per_page;
  RETURN QUERY
  WITH filtered_users AS (
    SELECT p.id, p.email, p.role, p.full_name, p.avatar_url, au.created_at, au.email_confirmed_at, p.selected_subjects, p.subject, p.grade, p.language
    FROM public.profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE (search_query IS NULL OR search_query = '' OR p.email ILIKE '%' || search_query || '%' OR p.full_name ILIKE '%' || search_query || '%')
  )
  SELECT f.id, f.email, f.role, f.full_name, f.avatar_url, f.created_at, f.email_confirmed_at, f.selected_subjects, f.subject, f.grade, f.language, (SELECT count(*) FROM filtered_users)::bigint AS total_count
  FROM filtered_users f
  ORDER BY f.created_at DESC
  LIMIT items_per_page
  OFFSET offset_val;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_users_paginated(int, int, text) TO authenticated;

-- 4.8 Оценка тестов и начисление монет
CREATE OR REPLACE FUNCTION public.evaluate_test(
    p_lesson_id TEXT,
    p_user_answers JSONB,
    p_question_ids JSONB,
    p_time_spent INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lesson_content JSONB;
    v_test_questions JSONB;
    v_question JSONB;
    v_q_id TEXT;
    v_user_answer JSONB;
    v_total_questions INT;
    v_correct_count INT := 0;
    v_score INT := 0;
    v_is_passed BOOLEAN := false;
    v_pass_threshold INT := 80;
    v_details JSONB := '[]'::JSONB;
    v_user_id UUID;
    v_is_correct BOOLEAN;
    v_correct_value TEXT;
    v_correct_matches JSONB;
    v_subject_id TEXT;
    v_bonus_coins INT := 0;
    v_bonus_xp INT := 0;
    i INT;
BEGIN
    v_user_id := auth.uid();
    -- Очистка p_lesson_id (если прилетает с кавычками)
    p_lesson_id := trim('"' from p_lesson_id::text);
    
    v_total_questions := jsonb_array_length(p_question_ids);
    IF v_total_questions IS NULL OR v_total_questions = 0 THEN RAISE EXCEPTION 'No questions provided for evaluation'; END IF;

    SELECT content_ru, subject INTO v_lesson_content, v_subject_id FROM public.lessons WHERE id = p_lesson_id;
    IF v_lesson_content IS NULL THEN RAISE EXCEPTION 'Lesson not found: %', p_lesson_id; END IF;

    v_test_questions := v_lesson_content->'test'->'questions';
    IF v_test_questions IS NULL OR jsonb_array_length(v_test_questions) = 0 THEN RAISE EXCEPTION 'Test questions not found for this lesson'; END IF;

    FOR i IN 0 .. v_total_questions - 1 LOOP
        v_q_id := p_question_ids->>i;
        v_user_answer := p_user_answers->v_q_id;
        v_is_correct := false;

        SELECT obj INTO v_question FROM jsonb_array_elements(v_test_questions) obj WHERE obj->>'id' = v_q_id;

        IF v_question IS NOT NULL THEN
            IF v_user_answer IS NOT NULL THEN
                IF v_question->>'type' = 'multiple_choice' THEN
                    IF trim('"' from v_user_answer::text) = v_question->>'correctId' THEN v_is_correct := true; END IF;
                ELSIF v_question->>'type' = 'numeric' THEN
                    v_correct_value := (SELECT string_agg(elem#>>'{}', '') FROM jsonb_array_elements(COALESCE(v_question->'digits', '[]'::jsonb)) elem);
                    IF trim('"' from v_user_answer::text) = v_correct_value THEN v_is_correct := true; END IF;
                ELSIF v_question->>'type' = 'matching' THEN
                    v_correct_matches := v_question->'correctMatches';
                    IF v_correct_matches IS NOT NULL AND jsonb_typeof(v_user_answer) = 'object' THEN
                        IF (SELECT count(*) FROM jsonb_object_keys(v_correct_matches)) = (SELECT count(*) FROM jsonb_object_keys(v_user_answer)) AND
                           v_correct_matches <@ v_user_answer AND v_user_answer <@ v_correct_matches THEN v_is_correct := true; END IF;
                    END IF;
                END IF;
            END IF;

            IF v_is_correct THEN v_correct_count := v_correct_count + 1; END IF;

            v_details := v_details || jsonb_build_object(
                'question_id', v_q_id, 'question_text', COALESCE(v_question->>'text', ''), 'type', COALESCE(v_question->>'type', ''),
                'question', v_question, 'userAnswer', COALESCE(v_user_answer, 'null'::jsonb), 'is_correct', v_is_correct
            );
        END IF;
    END LOOP;

    v_score := round((v_correct_count::numeric / v_total_questions::numeric) * 100);
    IF v_score >= v_pass_threshold THEN v_is_passed := true; END IF;

    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.user_test_results (user_id, lesson_id, score, correct_count, total_questions, is_passed, answers_detail, time_spent_seconds)
        VALUES (v_user_id, p_lesson_id, v_score, v_correct_count, v_total_questions, v_is_passed, v_details, p_time_spent);

        IF v_is_passed THEN
            INSERT INTO public.coin_transactions (user_id, amount, reason, subject_id, lesson_id) 
            VALUES (v_user_id, 3, 'test_passed', v_subject_id, p_lesson_id);
            
            -- Начисляем XP (50 XP за тест по плану)
            PERFORM public.grant_xp(50, 'test_passed', v_subject_id, p_lesson_id);
        END IF;

        -- Бонусы за скорость (Этап 3 - Новые правила)
        -- Среднее время на вопрос <= 5 секунд
        IF p_time_spent > 0 AND (p_time_spent::numeric / v_total_questions::numeric) <= 5 THEN
            -- +1 монета за каждый быстрый вопрос
            v_bonus_coins := v_total_questions;
            INSERT INTO public.coin_transactions (user_id, amount, reason, subject_id, lesson_id) 
            VALUES (v_user_id, v_bonus_coins, 'speed_bonus_per_q', v_subject_id, p_lesson_id);
            
            -- Накопительный бонус XP за каждые 10 быстрых вопросов
            UPDATE public.profiles 
            SET fast_q_count = COALESCE(fast_q_count, 0) + v_total_questions,
                updated_at = now()
            WHERE id = v_user_id
            RETURNING fast_q_count INTO v_fast_q_total;

            -- Проверяем, перешагнули ли мы порог в 10 вопросов
            IF (v_fast_q_total / 10) > ((v_fast_q_total - v_total_questions) / 10) THEN
                v_bonus_xp := 2 * ((v_fast_q_total / 10) - ((v_fast_q_total - v_total_questions) / 10));
                PERFORM public.grant_xp(v_bonus_xp, 'speed_bonus_cumulative_10', v_subject_id, p_lesson_id);
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'score', v_score, 
        'correct', v_correct_count, 
        'total', v_total_questions, 
        'isPassed', v_is_passed, 
        'bonus_coins', v_bonus_coins,
        'bonus_xp', v_bonus_xp,
        'details', v_details,
        'time_spent_seconds', p_time_spent
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.evaluate_test(TEXT, JSONB, JSONB, INTEGER) TO authenticated;

-- 4.9 Получение глобальной доски почёта
CREATE OR REPLACE FUNCTION public.get_global_leaderboard(
    p_subject_id text DEFAULT NULL,
    p_branch_text text DEFAULT NULL,
    p_period text DEFAULT 'all'
)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    avatar_url text,
    total_coins bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date timestamptz := NULL;
BEGIN
    IF p_period = 'day' THEN
        v_start_date := now() - interval '1 day';
    ELSIF p_period = 'week' THEN
        v_start_date := now() - interval '1 week';
    ELSIF p_period = 'month' THEN
        v_start_date := now() - interval '1 month';
    END IF;

    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.full_name,
        p.avatar_url,
        COALESCE(SUM(ct.amount), 0)::bigint AS total_coins
    FROM public.profiles p
    JOIN public.coin_transactions ct ON p.id = ct.user_id
    WHERE 
        (v_start_date IS NULL OR ct.created_at >= v_start_date)
        AND (p_subject_id IS NULL OR ct.subject_id = p_subject_id)
        AND (p_branch_text IS NULL OR p.branch = p_branch_text)
    GROUP BY p.id, p.full_name, p.avatar_url
    HAVING SUM(ct.amount) > 0
    ORDER BY total_coins DESC, p.full_name ASC
    LIMIT 100;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(text, text, text) TO authenticated;

-- ========================================================================================
-- 4.10 TRIPLE GRADING SYSTEM: Расчет системных баллов
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.calculate_system_grades(
    p_class_id uuid,
    p_topic_id text,
    p_lesson_ids text[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB := '[]'::jsonb;
    v_student record;
    v_stats record;
    v_system_grade numeric;
    v_error_pct numeric;
    v_total_q int;
    v_total_err int;
    v_expected_lessons int;
BEGIN
    v_expected_lessons := COALESCE(array_length(p_lesson_ids, 1), 0);

    FOR v_student IN
        SELECT p.id, p.full_name, p.avatar_url
        FROM public.class_members cm
        JOIN public.profiles p ON p.id = cm.student_id
        WHERE cm.class_id = p_class_id
    LOOP
        -- Агрегируем результаты тестов для ученика по заданным урокам темы
        SELECT 
            COUNT(DISTINCT lesson_id) as lessons_taken,
            COALESCE(SUM(total_questions), 0) as total_questions,
            COALESCE(SUM(total_questions - correct_count), 0) as total_errors
        INTO v_stats
        FROM public.user_test_results
        WHERE user_id = v_student.id AND lesson_id = ANY(p_lesson_ids);

        v_total_q := v_stats.total_questions;
        v_total_err := v_stats.total_errors;

        -- Если ожидаются уроки, но ученик прошел не все
        IF v_expected_lessons > 0 AND v_stats.lessons_taken < v_expected_lessons THEN
            v_system_grade := 1;
        ELSIF v_total_q > 0 THEN
            v_error_pct := (v_total_err::numeric / v_total_q::numeric) * 100.0;
            v_system_grade := ROUND(10.0 - (v_error_pct / 10.0));
            IF v_system_grade < 0 THEN v_system_grade := 0; END IF;
        ELSE
            v_system_grade := NULL; -- Нет пройденных тестов и нет ожидаемых
        END IF;

        v_result := v_result || jsonb_build_object(
            'student_id', v_student.id,
            'full_name', v_student.full_name,
            'avatar_url', v_student.avatar_url,
            'total_questions', v_total_q,
            'total_errors', v_total_err,
            'system_grade', v_system_grade
        );
    END LOOP;

    RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.calculate_system_grades(uuid, text, text[]) TO authenticated;

-- ========================================================================================
-- 4.11 TRIPLE GRADING SYSTEM: Получение журнала оценок
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.get_topic_grades_matrix(
    p_class_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB := '[]'::jsonb;
    v_student record;
    v_grades JSONB;
BEGIN
    FOR v_student IN
        SELECT p.id, p.full_name, p.avatar_url
        FROM public.class_members cm
        JOIN public.profiles p ON p.id = cm.student_id
        WHERE cm.class_id = p_class_id
        ORDER BY p.full_name ASC
    LOOP
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'topic_id', tg.topic_id,
                'system_grade', tg.system_grade,
                'teacher_grade', tg.teacher_grade,
                'review_grade', tg.review_grade,
                'comment', tg.comment
            )
        ), '[]'::jsonb)
        INTO v_grades
        FROM public.topic_grades tg
        WHERE tg.student_id = v_student.id AND tg.class_id = p_class_id;

        v_result := v_result || jsonb_build_object(
            'student_id', v_student.id,
            'full_name', v_student.full_name,
            'avatar_url', v_student.avatar_url,
            'grades', v_grades
        );
    END LOOP;

    RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_topic_grades_matrix(uuid) TO authenticated;

-- ========================================================================================
-- 4.12 TRIPLE GRADING SYSTEM: Массовое сохранение оценок (UPSERT)
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.save_topic_grades(
    p_class_id uuid,
    p_topic_id text,
    p_grades_array JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item JSONB;
    v_teacher_id uuid;
BEGIN
    v_teacher_id := auth.uid();

    -- Перебираем массив оценок
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_grades_array)
    LOOP
        INSERT INTO public.topic_grades (
            student_id, class_id, topic_id, system_grade, teacher_grade, comment, teacher_id, updated_at
        ) VALUES (
            (v_item->>'student_id')::uuid,
            p_class_id,
            p_topic_id,
            (v_item->>'system_grade')::numeric,
            v_item->>'teacher_grade',
            v_item->>'comment',
            v_teacher_id,
            now()
        )
        ON CONFLICT (student_id, class_id, topic_id) 
        DO UPDATE SET 
            system_grade = COALESCE(EXCLUDED.system_grade, public.topic_grades.system_grade),
            teacher_grade = COALESCE(EXCLUDED.teacher_grade, public.topic_grades.teacher_grade),
            comment = COALESCE(EXCLUDED.comment, public.topic_grades.comment),
            teacher_id = CASE 
                WHEN EXCLUDED.teacher_grade IS NOT NULL OR EXCLUDED.comment IS NOT NULL OR EXCLUDED.system_grade IS NOT NULL 
                THEN EXCLUDED.teacher_id 
                ELSE public.topic_grades.teacher_id 
            END,
            updated_at = now();

        -- ОТПРАВКА УВЕДОМЛЕНИЯ УЧЕНИКУ
        PERFORM public.send_notification(
            (v_item->>'student_id')::uuid,
            'test_checked',
            'Выставлена оценка за тему',
            'Баҳои мавзӯъ гузошта шуд',
            'Учитель проверил ваши работы по теме: ' || p_topic_id,
            'Муаллим корҳои шуморо аз рӯи мавзӯи ' || p_topic_id || ' санҷид',
            jsonb_build_object('class_id', p_class_id, 'topic_id', p_topic_id)
        );
    END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.save_topic_grades(uuid, text, JSONB) TO authenticated;


-- 4.14 Массовая рассылка уведомлений (RPC для админов)
CREATE OR REPLACE FUNCTION public.send_mass_notification(
    p_targets text, -- 'all', 'branch', 'class'
    p_target_id uuid, -- NULL для 'all', ID класса. Для branch используем p_target_val
    p_target_val text, -- Название филиала
    p_type text,
    p_title_ru text,
    p_title_tj text,
    p_message_ru text,
    p_message_tj text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_teacher_or_above() THEN RAISE EXCEPTION 'Недостаточно прав'; END IF;

    IF p_targets = 'all' THEN
        INSERT INTO public.notifications (user_id, type, title_ru, title_tj, message_ru, message_tj, metadata)
        SELECT id, p_type, p_title_ru, p_title_tj, p_message_ru, p_message_tj, p_metadata
        FROM public.profiles;
    ELSIF p_targets = 'branch' AND p_target_val IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title_ru, title_tj, message_ru, message_tj, metadata)
        SELECT id, p_type, p_title_ru, p_title_tj, p_message_ru, p_message_tj, p_metadata
        FROM public.profiles
        WHERE branch = p_target_val;
    ELSIF p_targets = 'class' AND p_target_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title_ru, title_tj, message_ru, message_tj, metadata)
        SELECT student_id, p_type, p_title_ru, p_title_tj, p_message_ru, p_message_tj, p_metadata
        FROM public.class_members
        WHERE class_id = p_target_id;
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.send_mass_notification TO authenticated;


-- ========================================================================================
-- 5. RLS ПОЛИТИКИ И ДОСТУПЫ
-- ========================================================================================

-- Очистка старых политик (чтобы избежать конфликтов)
DO $$
DECLARE pol TEXT; tab TEXT;
BEGIN
    FOR pol, tab IN 
        SELECT policyname, tablename FROM pg_policies 
        WHERE tablename IN (
            'profiles', 'branches', 'classes', 'class_teachers', 'class_members', 
            'subject_permissions', 'user_lesson_progress', 'user_test_results', 
            'coin_transactions', 'lessons', 'subject_syllabus', 'tests', 'questions', 'topic_grades'
        ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tab);
    END LOOP;
END $$;

-- Включаем RLS на всех таблицах
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Подстраховка для контент-таблиц (создавались в других скриптах, но мы страхуем их политики)
DO $$
BEGIN
    EXECUTE 'ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.subject_syllabus ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.tests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------------------
-- 5.1 PROFILES (Профили)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ( auth.uid() = id );
-- Все авторизованные могут видеть информацию профилей друг друга (для рейтингов и списков классов)
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id )
  WITH CHECK (role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) OR role = 'student'); -- Не может сам повысить роль
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING ( is_super_admin() );
CREATE POLICY "Super admins can update all profiles" ON public.profiles FOR UPDATE USING ( is_super_admin() );
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ( is_admin_or_above() );
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING ( is_admin_or_above() );
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK ( is_admin_or_above() );

-- ----------------------------------------------------------------------------------------
-- 5.2 BRANCHES (Филиалы)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Everyone can view branches" ON public.branches FOR SELECT USING (true);

-- 5.11 NOTIFICATIONS (Уведомления)
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5.12 ANNOUNCEMENTS (Анонсы)
CREATE POLICY "Everyone can view active announcements" ON public.announcements
    FOR SELECT USING (expires_at IS NULL OR expires_at > now());
CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (public.is_teacher_or_above());
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL USING (is_admin_or_above());

-- ----------------------------------------------------------------------------------------
-- 5.3 CLASSES (Классы)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Authenticated can view classes" ON public.classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teachers and admins can create classes" ON public.classes FOR INSERT WITH CHECK (is_teacher_or_above());
CREATE POLICY "Owner or admin can update classes" ON public.classes FOR UPDATE USING (teacher_id = auth.uid() OR is_admin_or_above());
CREATE POLICY "Owner or admin can delete classes" ON public.classes FOR DELETE USING (teacher_id = auth.uid() OR is_admin_or_above());

-- ----------------------------------------------------------------------------------------
-- 5.4 CLASS_TEACHERS (Со-преподаватели)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Everyone can view class_teachers" ON public.class_teachers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teachers and admins can insert class_teachers" ON public.class_teachers FOR INSERT WITH CHECK (is_teacher_or_above());
CREATE POLICY "Authorized users can delete class_teachers" ON public.class_teachers FOR DELETE 
USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid()) OR is_admin_or_above());

-- ----------------------------------------------------------------------------------------
-- 5.5 CLASS_MEMBERS (Участники классов)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Authenticated can view class members" ON public.class_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teacher, student self, or admin can insert members" ON public.class_members FOR INSERT
WITH CHECK (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid()) 
OR EXISTS (SELECT 1 FROM public.class_teachers WHERE class_id = class_members.class_id AND teacher_id = auth.uid()) OR is_admin_or_above());
CREATE POLICY "Teacher, student self, or admin can delete members" ON public.class_members FOR DELETE
USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid()) 
OR EXISTS (SELECT 1 FROM public.class_teachers WHERE class_id = class_members.class_id AND teacher_id = auth.uid()) OR is_admin_or_above());

-- ----------------------------------------------------------------------------------------
-- 5.6 SUBJECT_PERMISSIONS (Права преподавателей)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Admins can view all permissions" ON public.subject_permissions FOR SELECT USING ( is_admin_or_above() );
CREATE POLICY "Teachers can view own permissions" ON public.subject_permissions FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Admins can insert permissions" ON public.subject_permissions FOR INSERT WITH CHECK ( is_admin_or_above() );
CREATE POLICY "Admins can update permissions" ON public.subject_permissions FOR UPDATE USING ( is_admin_or_above() );
CREATE POLICY "Admins can delete permissions" ON public.subject_permissions FOR DELETE USING ( is_admin_or_above() );

-- ----------------------------------------------------------------------------------------
-- 5.7 COIN_TRANSACTIONS (Монеты)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Users can view own coin transactions" ON public.coin_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Teachers can view class students coins" ON public.coin_transactions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id
  LEFT JOIN public.class_teachers ct ON ct.class_id = c.id WHERE cm.student_id = coin_transactions.user_id AND (c.teacher_id = auth.uid() OR ct.teacher_id = auth.uid())));
CREATE POLICY "Admins can view all coin transactions" ON public.coin_transactions FOR SELECT USING (is_admin_or_above());
CREATE POLICY "Service can insert coin transactions" ON public.coin_transactions FOR INSERT WITH CHECK (false); -- Только RPC функция

-- ----------------------------------------------------------------------------------------
-- 5.8 ПРОГРЕСС И ТЕСТЫ (Статистика)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Users can view own test results" ON public.user_test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test results" ON public.user_test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all test results" ON public.user_test_results FOR SELECT USING (is_admin_or_above());
CREATE POLICY "Teachers can view class students test results" ON public.user_test_results FOR SELECT
USING (EXISTS (SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id 
  LEFT JOIN public.class_teachers ct ON ct.class_id = c.id WHERE cm.student_id = user_test_results.user_id AND (c.teacher_id = auth.uid() OR ct.teacher_id = auth.uid())));

CREATE POLICY "Users can view own lesson progress" ON public.user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON public.user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON public.user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lesson progress" ON public.user_lesson_progress FOR SELECT USING (is_admin_or_above());
CREATE POLICY "Teachers can view class students lesson progress" ON public.user_lesson_progress FOR SELECT
USING (EXISTS (SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id 
  LEFT JOIN public.class_teachers ct ON ct.class_id = c.id WHERE cm.student_id = user_lesson_progress.user_id AND (c.teacher_id = auth.uid() OR ct.teacher_id = auth.uid())));

-- ----------------------------------------------------------------------------------------
-- 5.8.1 TOPIC_GRADES (Оценки за темы)
-- ----------------------------------------------------------------------------------------
CREATE POLICY "Users can view own topic grades" ON public.topic_grades FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can manage class topic grades" ON public.topic_grades FOR ALL 
USING (EXISTS (SELECT 1 FROM public.classes c LEFT JOIN public.class_teachers ct ON ct.class_id = c.id WHERE c.id = topic_grades.class_id AND (c.teacher_id = auth.uid() OR ct.teacher_id = auth.uid())));
CREATE POLICY "Admins can view and manage all topic grades" ON public.topic_grades FOR ALL USING (is_admin_or_above());

-- ----------------------------------------------------------------------------------------
-- 5.9 КОНТЕНТ (Уроки, Программы курсов, Тесты, Вопросы)
-- ----------------------------------------------------------------------------------------
-- Это гарантирует что если таблицы существуют, они будут защищены
DO $$
BEGIN
    -- Lessons
    EXECUTE 'CREATE POLICY "Everyone can view lessons" ON public.lessons FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Teachers can insert lessons" ON public.lessons FOR INSERT WITH CHECK (is_teacher_or_above())';
    EXECUTE 'CREATE POLICY "Teachers can update lessons" ON public.lessons FOR UPDATE USING (is_teacher_or_above())';
    EXECUTE 'CREATE POLICY "Teachers can delete lessons" ON public.lessons FOR DELETE USING (is_teacher_or_above())';
    
    -- Subject Syllabus
    EXECUTE 'CREATE POLICY "Everyone can view syllabus" ON public.subject_syllabus FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Teachers can insert syllabus" ON public.subject_syllabus FOR INSERT WITH CHECK (is_teacher_or_above())';
    EXECUTE 'CREATE POLICY "Teachers can update syllabus" ON public.subject_syllabus FOR UPDATE USING (is_teacher_or_above())';
    EXECUTE 'CREATE POLICY "Teachers can delete syllabus" ON public.subject_syllabus FOR DELETE USING (is_teacher_or_above())';
    
    -- Tests / Questions (Если они выделены в отдельные таблицы)
    EXECUTE 'CREATE POLICY "Everyone can view tests" ON public.tests FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Teachers can modify tests" ON public.tests FOR ALL USING (is_teacher_or_above())';
    EXECUTE 'CREATE POLICY "Everyone can view questions" ON public.questions FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Teachers can modify questions" ON public.questions FOR ALL USING (is_teacher_or_above())';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ========================================================================================
-- 6. ИНДЕКСЫ (Для производительности)
-- ========================================================================================

CREATE INDEX IF NOT EXISTS idx_test_results_user ON public.user_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_lesson ON public.user_test_results(lesson_id);
CREATE INDEX IF NOT EXISTS idx_test_results_answers_detail ON public.user_test_results USING GIN (answers_detail);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON public.coin_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_subject_id ON public.coin_transactions(subject_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_lesson_id ON public.coin_transactions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student_id ON public.class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher ON public.class_teachers(teacher_id);

-- 4.13 ANALYTICS & STATISTICS (NEW RPCs)

-- 4.13.1 Расширенная статистика ученика (Dashboard + Страницы предметов)
CREATE OR REPLACE FUNCTION public.get_student_dashboard_stats(
    p_subject_ids text[] DEFAULT '{}',
    p_period text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_start_date timestamp;
    v_total_tests int := 0;
    v_avg_score int := 0;
    v_lessons_completed int := 0;
    v_passed_count int := 0;
    v_lesson_stats jsonb := '{}'::jsonb;
    v_dynamics jsonb := '[]'::jsonb;
    v_stats_map jsonb := '{}'::jsonb;
    v_subj_id text;
    v_section jsonb;
    v_topic jsonb;
    v_lesson jsonb;
    v_topic_avg int;
    v_section_avg int;
    v_lessons_in_topic int;
    v_total_score_in_topic int;
    v_lessons_in_section int;
    v_total_score_in_section int;
    v_lesson_id text;
    v_subjects jsonb := '[]'::jsonb;
    v_topics_in_section_completed int;
    v_total_lessons_sum int := 0;
    v_best_score int := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN NULL; END IF;

    -- 1. Настройки периода
    v_start_date := CASE 
        WHEN p_period = 'week' THEN now() - interval '7 days'
        WHEN p_period = 'month' THEN now() - interval '30 days'
        ELSE '1970-01-01'::timestamp
    END;

    -- 2. Сводные показатели
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(ROUND(AVG(score)), 0),
        COALESCE(COUNT(DISTINCT lesson_id), 0),
        COALESCE(SUM(CASE WHEN is_passed THEN 1 ELSE 0 END), 0)
    INTO v_total_tests, v_avg_score, v_lessons_completed, v_passed_count
    FROM public.user_test_results
    WHERE user_id = v_user_id AND created_at >= v_start_date;

    SELECT COALESCE(MAX(score), 0) INTO v_best_score 
    FROM public.user_test_results WHERE user_id = v_user_id;

    -- 3. Динамика
    SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM-DD') as date,
            ROUND(AVG(score)) as "avgScore",
            ROUND(SUM(CASE WHEN is_passed THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100) as "passRate",
            COUNT(*) as "testsCount"
        FROM public.user_test_results
        WHERE user_id = v_user_id AND created_at >= v_start_date
        GROUP BY 1
        ORDER BY MIN(created_at)
    ) d INTO v_dynamics;

    -- 4. Агрегация по урокам
    WITH test_agg AS (
        SELECT 
            lesson_id,
            ROUND(AVG(score)) as avg_score,
            MAX(score) as best_score,
            COUNT(*) as attempts,
            MAX(created_at) as last_at
        FROM public.user_test_results
        WHERE user_id = v_user_id
        GROUP BY lesson_id
    )
    SELECT COALESCE(jsonb_object_agg(lesson_id, jsonb_build_object(
        'avgScore', avg_score,
        'bestScore', best_score,
        'attempts', attempts,
        'lastAttemptAt', last_at,
        'avgErrorRate', 100 - avg_score
    )), '{}'::jsonb) INTO v_lesson_stats FROM test_agg;

    -- 5. Иерархическая статистика (statsMap)
    IF array_length(p_subject_ids, 1) > 0 THEN
        FOR v_subj_id IN SELECT unnest(p_subject_ids) LOOP
            FOR v_section IN SELECT jsonb_array_elements(COALESCE(s.data->'sections', '[]'::jsonb)) FROM public.subject_syllabus s WHERE s.subject = v_subj_id LOOP
                v_lessons_in_section := 0;
                v_total_score_in_section := 0;
                v_topics_in_section_completed := 0;

                FOR v_topic IN SELECT jsonb_array_elements(COALESCE(v_section->'topics', '[]'::jsonb)) LOOP
                    v_lessons_in_topic := 0;
                    v_total_score_in_topic := 0;

                    FOR v_lesson IN SELECT jsonb_array_elements(COALESCE(v_topic->'lessons', '[]'::jsonb)) LOOP
                        v_lesson_id := v_lesson->>'id';
                        IF (v_lesson_stats ? v_lesson_id) THEN
                            v_lessons_in_topic := v_lessons_in_topic + 1;
                            v_total_score_in_topic := v_total_score_in_topic + (v_lesson_stats->v_lesson_id->>'avgScore')::int;
                        END IF;
                    END LOOP;

                    IF v_lessons_in_topic > 0 THEN
                        v_topic_avg := ROUND(v_total_score_in_topic::float / v_lessons_in_topic::float);
                        v_stats_map := v_stats_map || jsonb_build_object(v_topic->>'id', jsonb_build_object(
                            'avgScore', v_topic_avg,
                            'avgErrorRate', 100 - v_topic_avg,
                            'completedLessons', v_lessons_in_topic
                        ));
                        
                        v_topics_in_section_completed := v_topics_in_section_completed + 1;
                        v_lessons_in_section := v_lessons_in_section + v_lessons_in_topic;
                        v_total_score_in_section := v_total_score_in_section + v_topic_avg;
                    END IF;
                END LOOP;

                IF v_topics_in_section_completed > 0 THEN
                    v_section_avg := ROUND(v_total_score_in_section::float / v_topics_in_section_completed::float);
                    v_stats_map := v_stats_map || jsonb_build_object(v_section->>'id', jsonb_build_object(
                        'avgScore', v_section_avg,
                        'avgErrorRate', 100 - v_section_avg,
                        'completedLessons', v_lessons_in_section,
                        'completedTopics', v_topics_in_section_completed
                    ));
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    -- 6. Агрегация по предметам
    IF array_length(p_subject_ids, 1) > 0 THEN
        FOR v_subj_id IN SELECT unnest(p_subject_ids) LOOP
            SELECT COUNT(*) INTO v_lessons_in_topic 
            FROM public.subject_syllabus s,
                 jsonb_array_elements(COALESCE(s.data->'sections', '[]'::jsonb)) as sec,
                 jsonb_array_elements(COALESCE(sec->'topics', '[]'::jsonb)) as top,
                 jsonb_array_elements(COALESCE(top->'lessons', '[]'::jsonb)) as les
            WHERE s.subject = v_subj_id;

            SELECT 
                COALESCE(COUNT(DISTINCT lesson_id), 0),
                COALESCE(ROUND(AVG(score)), 0)
            INTO v_lessons_in_section, v_topic_avg
            FROM public.user_test_results
            WHERE user_id = v_user_id AND lesson_id IN (
                SELECT (les->>'id')
                FROM public.subject_syllabus s,
                     jsonb_array_elements(COALESCE(s.data->'sections', '[]'::jsonb)) as sec,
                     jsonb_array_elements(COALESCE(sec->'topics', '[]'::jsonb)) as top,
                     jsonb_array_elements(COALESCE(top->'lessons', '[]'::jsonb)) as les
                WHERE s.subject = v_subj_id
            );

            v_subjects := v_subjects || jsonb_build_object(
                'subjectId', v_subj_id,
                'completedLessons', v_lessons_in_section,
                'totalLessons', v_lessons_in_topic,
                'progress', CASE WHEN v_lessons_in_topic > 0 THEN ROUND((v_lessons_in_section::float / v_lessons_in_topic::float) * 100) ELSE 0 END,
                'avgScore', v_topic_avg
            );
        END LOOP;
    END IF;

    -- 7. Расчет общего количества уроков
    IF array_length(p_subject_ids, 1) > 0 THEN
        SELECT COALESCE(SUM((val->>'totalLessons')::int), 0) INTO v_total_lessons_sum 
        FROM jsonb_array_elements(v_subjects) as val;
    ELSE
        SELECT COUNT(*) INTO v_total_lessons_sum 
        FROM public.subject_syllabus s,
             jsonb_array_elements(COALESCE(s.data->'sections', '[]'::jsonb)) as sec,
             jsonb_array_elements(COALESCE(sec->'topics', '[]'::jsonb)) as top,
             jsonb_array_elements(COALESCE(top->'lessons', '[]'::jsonb)) as les;
    END IF;

    -- Итоговый результат
    RETURN jsonb_build_object(
        'summary', jsonb_build_object(
            'totalTests', v_total_tests,
            'avgScore', v_avg_score,
            'bestScore', v_best_score,
            'completedLessons', v_lessons_completed,
            'totalLessons', v_total_lessons_sum,
            'passRate', CASE WHEN v_total_tests > 0 THEN ROUND((v_passed_count::float / v_total_tests::float) * 100) ELSE 0 END
        ),
        'dynamics', v_dynamics,
        'subjects', v_subjects,
        'lessonStats', v_lesson_stats,
        'statsMap', v_stats_map
    );
END;
$$;
        'subjects', v_subjects,
        'lessonStats', COALESCE(v_lesson_stats, '{}'::jsonb),
        'statsMap', v_stats_map
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_student_dashboard_stats(text[], text) TO authenticated;

-- 4.13.2 Полная аналитика класса для учителя
CREATE OR REPLACE FUNCTION public.get_class_analytics_stats(
    p_class_id uuid,
    p_period text DEFAULT 'all',
    p_student_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date timestamp;
    v_student_count int;
    v_total_tests int;
    v_avg_score int;
    v_pass_rate int;
    v_dynamics jsonb;
    v_top_students jsonb;
    v_difficult_questions jsonb;
    v_tests_breakdown jsonb;
    v_course_progress jsonb;
    v_subject_id text;
    v_total_lessons int := 0;
BEGIN
    -- Настройки периода
    v_start_date := CASE 
        WHEN p_period = 'day' THEN now() - interval '1 day'
        WHEN p_period = 'week' THEN now() - interval '7 days'
        WHEN p_period = 'month' THEN now() - interval '30 days'
        ELSE '1970-01-01'::timestamp
    END;

    -- Получаем subject_id класса
    SELECT subject_id INTO v_subject_id FROM public.classes WHERE id = p_class_id;
    
    -- Подсчет общего кол-ва учеников в классе
    SELECT COUNT(*) INTO v_student_count FROM public.class_members WHERE class_id = p_class_id;

    -- Подсчет общего кол-ва уроков в курсе из syllabus
    BEGIN
        WITH lessons AS (
            SELECT (jsonb_array_elements(COALESCE(data->'sections', '[]'::jsonb))->'topics') as topics
            FROM public.subject_syllabus WHERE subject = v_subject_id
        ), 
        topic_list AS (
            SELECT jsonb_array_elements(COALESCE(topics, '[]'::jsonb))->'lessons' as lessons_arr FROM lessons
        )
        SELECT COUNT(*) INTO v_total_lessons FROM (SELECT jsonb_array_elements(COALESCE(lessons_arr, '[]'::jsonb)) FROM topic_list) l;
    EXCEPTION WHEN OTHERS THEN 
        v_total_lessons := 0;
    END;

    -- 1. Сводные показатели
    SELECT 
        COUNT(*),
        ROUND(AVG(score)),
        ROUND(SUM(CASE WHEN is_passed THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100)
    INTO v_total_tests, v_avg_score, v_pass_rate
    FROM public.user_test_results
    WHERE class_id = p_class_id 
      AND (p_student_id IS NULL OR user_id = p_student_id)
      AND created_at >= v_start_date;

    -- 2. Динамика
    SELECT jsonb_agg(d) FROM (
        SELECT 
            to_char(created_at, 'DD.MM') as date,
            ROUND(AVG(score)) as "avgScore",
            ROUND(SUM(CASE WHEN is_passed THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100) as "passRate"
        FROM public.user_test_results
        WHERE class_id = p_class_id 
          AND (p_student_id IS NULL OR user_id = p_student_id)
          AND created_at >= v_start_date
        GROUP BY 1
        ORDER BY MIN(created_at)
    ) d INTO v_dynamics;

    -- 3. Топ учеников
    SELECT jsonb_agg(t) FROM (
        SELECT 
            u.id,
            p.full_name as name,
            p.avatar_url as avatar,
            COUNT(*) as "testsCount",
            ROUND(AVG(u.score)) as "avgScore"
        FROM public.user_test_results u
        JOIN public.profiles p ON u.user_id = p.id
        WHERE u.class_id = p_class_id AND u.created_at >= v_start_date
        GROUP BY u.id, p.full_name, p.avatar_url
        ORDER BY "avgScore" DESC
        LIMIT 10
    ) t INTO v_top_students;

    -- 4. Трудные вопросы
    SELECT jsonb_agg(q) FROM (
        SELECT 
            ans->>'question_id' as question_id,
            ans->>'question_text' as question_text,
            r.lesson_id,
            COUNT(*) as total,
            ROUND(SUM(CASE WHEN (ans->>'is_correct')::boolean = false THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100) as "errorRate"
        FROM public.user_test_results r,
        jsonb_array_elements(r.answers_detail) as ans
        WHERE r.class_id = p_class_id AND r.created_at >= v_start_date
        GROUP BY 1, 2, 3
        HAVING COUNT(*) > 2
        ORDER BY "errorRate" DESC
        LIMIT 10
    ) q INTO v_difficult_questions;

    -- 5. Разбивка по тестам
    SELECT jsonb_agg(b) FROM (
        SELECT 
            lesson_id as "lessonId",
            COUNT(*) as "attemptsCount",
            ROUND(AVG(score)) as "averageScore",
            ROUND(SUM(CASE WHEN is_passed THEN 0 ELSE 1 END)::float / COUNT(*)::float * 100) as "failRate"
        FROM public.user_test_results
        WHERE class_id = p_class_id AND created_at >= v_start_date
        GROUP BY 1
        ORDER BY "averageScore" ASC
    ) b INTO v_tests_breakdown;

    -- 6. Прогресс курса
    SELECT jsonb_build_object(
        'averagePercent', COALESCE(ROUND(AVG(percent)), 0),
        'studentsProgress', COALESCE(jsonb_agg(p), '[]'::jsonb)
    ) INTO v_course_progress
    FROM (
        SELECT 
            m.user_id as id,
            pr.full_name as name,
            COUNT(DISTINCT lp.lesson_id) as opened,
            v_total_lessons as total,
            CASE WHEN v_total_lessons > 0 THEN ROUND((COUNT(DISTINCT lp.lesson_id)::float / v_total_lessons::float) * 100) ELSE 0 END as percent
        FROM public.class_members m
        JOIN public.profiles pr ON m.user_id = pr.id
        LEFT JOIN public.user_lesson_progress lp ON m.user_id = lp.user_id
        WHERE m.class_id = p_class_id
        GROUP BY m.user_id, pr.full_name
        ORDER BY percent DESC
    ) p;

    RETURN jsonb_build_object(
        'summary', jsonb_build_object(
            'studentsCount', COALESCE(v_student_count, 0),
            'totalTestsTaken', COALESCE(v_total_tests, 0),
            'averageTestScore', COALESCE(v_avg_score, 0),
            'passRate', COALESCE(v_pass_rate, 0),
            'testsBreakdown', COALESCE(v_tests_breakdown, '[]'::jsonb)
        ),
        'dynamics', COALESCE(v_dynamics, '[]'::jsonb),
        'topStudents', COALESCE(v_top_students, '[]'::jsonb),
        'difficultQuestions', COALESCE(v_difficult_questions, '[]'::jsonb),
        'courseProgress', COALESCE(v_course_progress, jsonb_build_object('averagePercent', 0, 'studentsProgress', '[]'::jsonb))
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_class_analytics_stats(uuid, text, uuid) TO authenticated;


-- ========================================================================================
-- 11. ФИНАЛ: СКРИПТ УСПЕШНО ДОБАВЛЕН
-- ========================================================================================
