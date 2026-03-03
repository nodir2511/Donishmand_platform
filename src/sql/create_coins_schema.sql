-- ============================================================
-- МОНЕТЫ: Создание таблицы coin_transactions
-- Дата: 03.03.2026
-- Исправляет ошибку 400 в функции evaluate_test —
-- таблица coin_transactions не существовала, что вызывало
-- падение всей транзакции при завершении теста.
-- ============================================================

-- 1. Создание таблицы транзакций монет
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount      integer NOT NULL DEFAULT 0,
    reason      text DEFAULT 'test_passed',   -- Причина начисления
    created_at  timestamptz DEFAULT now()
);

-- Индекс для быстрой выборки баланса по пользователю
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id
    ON public.coin_transactions(user_id);

-- Включаем RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Сброс старых политик перед созданием (идемпотентность скрипта)
DROP POLICY IF EXISTS "Users can view own coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Service can insert coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Admins can view all coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Authenticated users can view all coin transactions" ON public.coin_transactions;

-- Монеты — публичные игровые данные (как очки на лидерборде).
-- Любой авторизованный пользователь (ученик, учитель, админ) может видеть
-- монеты всех остальных — это нужно для отображения лидерборда класса.
CREATE POLICY "Authenticated users can view all coin transactions"
    ON public.coin_transactions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Только серверные функции (SECURITY DEFINER) могут вставлять записи.
-- Обычный пользователь не может начислить себе монеты напрямую.
CREATE POLICY "Service can insert coin transactions"
    ON public.coin_transactions FOR INSERT
    WITH CHECK (false);

-- 2. Обновлённая функция evaluate_test (с обработкой монет через coin_transactions)
CREATE OR REPLACE FUNCTION evaluate_test(
    p_lesson_id TEXT,
    p_user_answers JSONB,
    p_question_ids JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    i INT;
BEGIN
    -- 1. Получаем текущего пользователя
    v_user_id := auth.uid();

    v_total_questions := jsonb_array_length(p_question_ids);
    IF v_total_questions IS NULL OR v_total_questions = 0 THEN
        RAISE EXCEPTION 'No questions provided for evaluation';
    END IF;

    -- 2. Загружаем контент урока (русская версия содержит правильные ответы)
    SELECT content_ru INTO v_lesson_content
    FROM lessons
    WHERE id = p_lesson_id;

    IF v_lesson_content IS NULL THEN
        RAISE EXCEPTION 'Lesson not found';
    END IF;

    v_test_questions := v_lesson_content->'test'->'questions';

    IF v_test_questions IS NULL OR jsonb_array_length(v_test_questions) = 0 THEN
        RAISE EXCEPTION 'Test questions not found for this lesson';
    END IF;

    -- 3. Проверяем каждый отправленный вопрос
    FOR i IN 0 .. v_total_questions - 1 LOOP
        v_q_id := p_question_ids->>i;
        v_user_answer := p_user_answers->v_q_id;
        v_is_correct := false;

        SELECT obj INTO v_question
        FROM jsonb_array_elements(v_test_questions) obj
        WHERE obj->>'id' = v_q_id;

        IF v_question IS NOT NULL THEN
            IF v_user_answer IS NOT NULL THEN
                IF v_question->>'type' = 'multiple_choice' THEN
                    IF trim('"' from v_user_answer::text) = v_question->>'correctId' THEN
                        v_is_correct := true;
                    END IF;

                ELSIF v_question->>'type' = 'numeric' THEN
                    -- ВАЖНО: elem#>>'{}' — правильный способ извлечь скалярное значение из jsonb элемента.
                    -- elem->>'{}' — НЕВЕРНО (ищет ключ с именем "{}"), всегда возвращает NULL.
                    v_correct_value := (
                        SELECT string_agg(elem#>>'{}', '')
                        FROM jsonb_array_elements(COALESCE(v_question->'digits', '[]'::jsonb)) elem
                    );
                    IF trim('"' from v_user_answer::text) = v_correct_value THEN
                        v_is_correct := true;
                    END IF;

                ELSIF v_question->>'type' = 'matching' THEN
                    v_correct_matches := v_question->'correctMatches';

                    IF v_correct_matches IS NOT NULL AND jsonb_typeof(v_user_answer) = 'object' THEN
                        IF (SELECT count(*) FROM jsonb_object_keys(v_correct_matches)) = (SELECT count(*) FROM jsonb_object_keys(v_user_answer)) AND
                           v_correct_matches <@ v_user_answer AND v_user_answer <@ v_correct_matches THEN
                            v_is_correct := true;
                        END IF;
                    END IF;
                END IF;
            END IF;

            IF v_is_correct THEN
                v_correct_count := v_correct_count + 1;
            END IF;

            v_details := v_details || jsonb_build_object(
                'question_id', v_q_id,
                'question_text', COALESCE(v_question->>'text', ''),
                'type', COALESCE(v_question->>'type', ''),
                'question', v_question,
                'userAnswer', COALESCE(v_user_answer, 'null'::jsonb),
                'is_correct', v_is_correct
            );
        END IF;
    END LOOP;

    -- 4. Рассчитываем баллы
    v_score := round((v_correct_count::numeric / v_total_questions::numeric) * 100);

    IF v_score >= v_pass_threshold THEN
        v_is_passed := true;
    END IF;

    -- 5. Сохраняем результат если пользователь авторизован
    IF v_user_id IS NOT NULL THEN
        INSERT INTO user_test_results (
            user_id,
            lesson_id,
            score,
            correct_count,
            total_questions,
            is_passed,
            answers_detail
        ) VALUES (
            v_user_id,
            p_lesson_id,
            v_score,
            v_correct_count,
            v_total_questions,
            v_is_passed,
            v_details
        );

        -- Начисляем монету за сдачу теста
        IF v_is_passed THEN
            INSERT INTO coin_transactions (user_id, amount, reason)
            VALUES (v_user_id, 1, 'test_passed');
        END IF;
    END IF;

    -- 6. Возвращаем результат клиенту
    RETURN jsonb_build_object(
        'score', v_score,
        'correct', v_correct_count,
        'total', v_total_questions,
        'isPassed', v_is_passed,
        'details', v_details
    );
END;
$$;

GRANT EXECUTE ON FUNCTION evaluate_test(TEXT, JSONB, JSONB) TO authenticated;
