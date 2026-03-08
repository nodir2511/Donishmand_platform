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
  selected_subjects text[] DEFAULT '{}'
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
    answers_detail jsonb DEFAULT '[]'::jsonb
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
    p_question_ids JSONB
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
    i INT;
BEGIN
    v_user_id := auth.uid();
    v_total_questions := jsonb_array_length(p_question_ids);
    IF v_total_questions IS NULL OR v_total_questions = 0 THEN RAISE EXCEPTION 'No questions provided for evaluation'; END IF;

    SELECT content_ru, subject INTO v_lesson_content, v_subject_id FROM public.lessons WHERE id = p_lesson_id;
    IF v_lesson_content IS NULL THEN RAISE EXCEPTION 'Lesson not found'; END IF;

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
        INSERT INTO public.user_test_results (user_id, lesson_id, score, correct_count, total_questions, is_passed, answers_detail)
        VALUES (v_user_id, p_lesson_id, v_score, v_correct_count, v_total_questions, v_is_passed, v_details);

        IF v_is_passed THEN
            INSERT INTO public.coin_transactions (user_id, amount, reason, subject_id, lesson_id) 
            VALUES (v_user_id, 3, 'test_passed', v_subject_id, p_lesson_id);
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'score', v_score, 'correct', v_correct_count, 'total', v_total_questions, 'isPassed', v_is_passed, 'details', v_details
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.evaluate_test(TEXT, JSONB, JSONB) TO authenticated;

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
            'coin_transactions', 'lessons', 'subject_syllabus', 'tests', 'questions'
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

-- ========================================================================================
-- ФИНАЛ: СКРИПТ УСПЕШНО ДОБАВЛЕН
-- ========================================================================================
