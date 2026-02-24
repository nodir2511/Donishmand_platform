-- ============================================================
-- МИГРАЦИЯ: Исправление RLS-политик для статистики класса
-- Выполнить в Supabase SQL Editor ЦЕЛИКОМ
-- Дата: 24.02.2026
-- ============================================================
-- Проблема: Учитель не может видеть данные учеников (тесты, прогресс)
-- из-за ограничительных RLS-политик (только auth.uid() = user_id).
-- Решение: Добавить политики чтения для учителей и админов.
-- ============================================================

-- ============================
-- 1. user_test_results
-- ============================

-- Админы и суперадмины могут видеть все результаты тестов
CREATE POLICY "Admins can view all test results"
  ON public.user_test_results FOR SELECT
  USING (is_admin_or_above());

-- Учителя могут видеть результаты тестов учеников своих классов
CREATE POLICY "Teachers can view class students test results"
  ON public.user_test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      LEFT JOIN public.class_teachers ct ON ct.class_id = c.id
      WHERE cm.student_id = user_test_results.user_id
        AND (c.teacher_id = auth.uid() OR ct.teacher_id = auth.uid())
    )
  );

-- ============================
-- 2. user_lesson_progress
-- ============================

-- Админы и суперадмины могут видеть весь прогресс уроков
CREATE POLICY "Admins can view all lesson progress"
  ON public.user_lesson_progress FOR SELECT
  USING (is_admin_or_above());

-- Учителя могут видеть прогресс учеников своих классов
CREATE POLICY "Teachers can view class students lesson progress"
  ON public.user_lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      LEFT JOIN public.class_teachers ct ON ct.class_id = c.id
      WHERE cm.student_id = user_lesson_progress.user_id
        AND (c.teacher_id = auth.uid() OR ct.teacher_id = auth.uid())
    )
  );

-- ============================================================
-- ГОТОВО! Теперь:
-- 1. Ученики по-прежнему видят только свои данные
-- 2. Учителя видят данные учеников своих классов
-- 3. Админы и суперадмины видят все данные
-- ============================================================
