-- ============================================================
-- МИГРАЦИЯ: Аналитика вопросов + Лидерборд
-- Выполнить в Supabase SQL Editor
-- Дата: 25.02.2026
-- ============================================================

-- 1. Добавляем колонку для деталей ответов (анализ сложных вопросов)
ALTER TABLE public.user_test_results 
  ADD COLUMN IF NOT EXISTS answers_detail jsonb;

-- 2. Индекс для быстрого поиска по answers_detail (GIN)
CREATE INDEX IF NOT EXISTS idx_test_results_answers_detail 
  ON public.user_test_results USING GIN (answers_detail);

-- ГОТОВО!
-- Теперь TestViewer будет записывать детали по каждому вопросу,
-- а statisticsService сможет агрегировать "сложные вопросы".
