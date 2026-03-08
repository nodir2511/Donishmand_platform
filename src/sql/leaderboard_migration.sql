-- ========================================================================================
-- МИГРАЦИЯ: ГЛОБАЛЬНАЯ ДОСКА ПОЧЁТА (Global Leaderboard)
-- ========================================================================================

-- 1. Добавляем новые колонки в таблицу транзакций монет
ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS subject_id text;
ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS lesson_id text;

-- 2. Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_coin_transactions_subject_id ON public.coin_transactions(subject_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_lesson_id ON public.coin_transactions(lesson_id);


-- 3. Обновляем функцию проверки тестов, чтобы она вытягивала предмет из урока и сохраняла его в монеты
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


-- 4. Создаем новую RPC функцию получения лидерборда с поддержкой филиалов и предметов
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
