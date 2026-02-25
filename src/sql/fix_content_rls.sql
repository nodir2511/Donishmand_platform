-- ============================================================
-- МИГРАЦИЯ: Исправление RLS на таблицах контента курсов
-- Выполнить в Supabase SQL Editor ЦЕЛИКОМ
-- Дата: 25.02.2026
-- ============================================================
-- Исправляет оставшиеся Security-предупреждения:
-- 1. lessons — INSERT/UPDATE/DELETE только для учителей и админов
-- 2. subject_syllabus — INSERT/UPDATE только для учителей и админов
-- 3. tests — INSERT/UPDATE/DELETE только для учителей и админов
-- 4. questions — INSERT/UPDATE/DELETE только для учителей и админов
-- ============================================================

-- Вспомогательная функция: проверка что пользователь — учитель или выше
-- (если не существует, создаём)
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


-- ============================================================
-- 1. LESSONS — Контент уроков
-- ============================================================

-- Удаляем ВСЕ старые политики
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lessons' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lessons', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- SELECT: Все могут читать уроки (ученики и учителя)
CREATE POLICY "Everyone can view lessons"
  ON public.lessons FOR SELECT
  USING (true);

-- INSERT: Только учителя и админы
CREATE POLICY "Teachers can insert lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (is_teacher_or_above());

-- UPDATE: Только учителя и админы
CREATE POLICY "Teachers can update lessons"
  ON public.lessons FOR UPDATE
  USING (is_teacher_or_above());

-- DELETE: Только учителя и админы
CREATE POLICY "Teachers can delete lessons"
  ON public.lessons FOR DELETE
  USING (is_teacher_or_above());


-- ============================================================
-- 2. SUBJECT_SYLLABUS — Структура предметов (JSON)
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'subject_syllabus' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.subject_syllabus', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.subject_syllabus ENABLE ROW LEVEL SECURITY;

-- SELECT: Все могут читать структуру предметов
CREATE POLICY "Everyone can view syllabus"
  ON public.subject_syllabus FOR SELECT
  USING (true);

-- INSERT: Только учителя и админы
CREATE POLICY "Teachers can insert syllabus"
  ON public.subject_syllabus FOR INSERT
  WITH CHECK (is_teacher_or_above());

-- UPDATE: Только учителя и админы
CREATE POLICY "Teachers can update syllabus"
  ON public.subject_syllabus FOR UPDATE
  USING (is_teacher_or_above());


-- ============================================================
-- 3. TESTS — Тесты
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tests' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tests', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- SELECT: Все могут читать тесты
CREATE POLICY "Everyone can view tests"
  ON public.tests FOR SELECT
  USING (true);

-- INSERT: Только учителя и админы
CREATE POLICY "Teachers can insert tests"
  ON public.tests FOR INSERT
  WITH CHECK (is_teacher_or_above());

-- UPDATE: Только учителя и админы
CREATE POLICY "Teachers can update tests"
  ON public.tests FOR UPDATE
  USING (is_teacher_or_above());

-- DELETE: Только учителя и админы
CREATE POLICY "Teachers can delete tests"
  ON public.tests FOR DELETE
  USING (is_teacher_or_above());


-- ============================================================
-- 4. QUESTIONS — Вопросы
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'questions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.questions', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- SELECT: Все могут читать вопросы
CREATE POLICY "Everyone can view questions"
  ON public.questions FOR SELECT
  USING (true);

-- INSERT: Только учителя и админы
CREATE POLICY "Teachers can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (is_teacher_or_above());

-- UPDATE: Только учителя и админы
CREATE POLICY "Teachers can update questions"
  ON public.questions FOR UPDATE
  USING (is_teacher_or_above());

-- DELETE: Только учителя и админы
CREATE POLICY "Teachers can delete questions"
  ON public.questions FOR DELETE
  USING (is_teacher_or_above());


-- ============================================================
-- ГОТОВО!
-- ============================================================
-- Теперь контент курсов (уроки, тесты, вопросы, структура) 
-- могут редактировать ТОЛЬКО учителя и админы.
-- Ученики могут только читать.
-- ============================================================
