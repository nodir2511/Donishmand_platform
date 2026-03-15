-- Функция для получения полной аналитики класса для учителя
-- С исправленной логикой подсчета учеников и обработки трудных вопросов

CREATE OR REPLACE FUNCTION get_class_analytics_stats(
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
            SELECT (jsonb_array_elements(data->'sections')->'topics') as topics
            FROM public.subject_syllabus WHERE subject = v_subject_id
        ), 
        topic_list AS (
            SELECT jsonb_array_elements(topics)->'lessons' as lessons_arr FROM lessons
        )
        SELECT COUNT(*) INTO v_total_lessons FROM (SELECT jsonb_array_elements(lessons_arr) FROM topic_list) l;
    EXCEPTION WHEN OTHERS THEN 
        v_total_lessons := 0;
    END;

    -- 1. Сводные показатели (по тестам)
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

    -- 4. Трудные вопросы (Исправлено: используем jsonb_array_elements)
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
