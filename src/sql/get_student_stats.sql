-- Функция для получения расширенной статистики ученика (Dashboard + Страницы предметов)
-- Теперь с полной иерархической агрегацией (Разделы, Темы) и исправленными именами полей

CREATE OR REPLACE FUNCTION get_student_dashboard_stats(
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
    v_summary record;
    v_lesson_stats jsonb;
    v_dynamics jsonb;
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
    v_topics_in_section_completed int;
    v_lesson_id text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN NULL; END IF;

    -- Настройки периода
    v_start_date := CASE 
        WHEN p_period = 'week' THEN now() - interval '7 days'
        WHEN p_period = 'month' THEN now() - interval '30 days'
        ELSE '1970-01-01'::timestamp
    END;

    -- 1. Сводные показатели
    SELECT 
        COUNT(*) as total_tests,
        ROUND(AVG(score)) as avg_score,
        COUNT(DISTINCT lesson_id) as lessons_completed,
        SUM(CASE WHEN is_passed THEN 1 ELSE 0 END) as passed_count
    INTO v_summary
    FROM public.user_test_results
    WHERE user_id = v_user_id AND created_at >= v_start_date;

    -- 2. Динамика по дням
    SELECT jsonb_agg(d) FROM (
        SELECT 
            to_char(created_at, 'DD.MM') as date,
            ROUND(AVG(score)) as "avgScore",
            ROUND(SUM(CASE WHEN is_passed THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100) as "passRate",
            COUNT(*) as "testsCount"
        FROM public.user_test_results
        WHERE user_id = v_user_id AND created_at >= v_start_date
        GROUP BY 1
        ORDER BY MIN(created_at)
    ) d INTO v_dynamics;

    -- 3. Агрегация по урокам
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
    SELECT jsonb_object_agg(lesson_id, jsonb_build_object(
        'avgScore', avg_score,
        'bestScore', best_score,
        'attempts', attempts,
        'lastAttemptAt', last_at,
        'avgErrorRate', 100 - avg_score
    )) INTO v_lesson_stats FROM test_agg;

    -- 4. Иерархическая агрегация (statsMap)
    IF array_length(p_subject_ids, 1) > 0 THEN
        FOR v_subj_id IN SELECT unnest(p_subject_ids) LOOP
            FOR v_section IN SELECT jsonb_array_elements(data->'sections') FROM public.subject_syllabus WHERE subject = v_subj_id LOOP
                v_lessons_in_section := 0;
                v_total_score_in_section := 0;
                v_topics_in_section_completed := 0;

                FOR v_topic IN SELECT jsonb_array_elements(v_section->'topics') LOOP
                    v_lessons_in_topic := 0;
                    v_total_score_in_topic := 0;

                    FOR v_lesson IN SELECT jsonb_array_elements(v_topic->'lessons') LOOP
                        v_lesson_id := v_lesson->>'id';
                        IF v_lesson_stats ? v_lesson_id THEN
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

    RETURN jsonb_build_object(
        'summary', jsonb_build_object(
            'totalTests', COALESCE(v_summary.total_tests, 0),
            'averageScore', COALESCE(v_summary.avg_score, 0),
            'lessonsCompleted', COALESCE(v_summary.lessons_completed, 0),
            'passRate', CASE WHEN v_summary.total_tests > 0 THEN ROUND((v_summary.passed_count::float / v_summary.total_tests::float) * 100) ELSE 0 END
        ),
        'dynamics', COALESCE(v_dynamics, '[]'::jsonb),
        'lessonStats', COALESCE(v_lesson_stats, '{}'::jsonb),
        'statsMap', v_stats_map
    );
END;
$$;
