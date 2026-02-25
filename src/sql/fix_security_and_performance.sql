-- ============================================================
-- МИГРАЦИЯ: Исправление безопасности и производительности
-- Выполнить в Supabase SQL Editor ЦЕЛИКОМ
-- Дата: 25.02.2026
-- ============================================================
-- Исправляет:
-- 1. Функции без SET search_path (SQL injection risk)
-- 2. RLS-политики «Enable all for authenticated» на classes, 
--    class_members, coin_transactions
-- 3. Недостающие индексы для производительности
-- ============================================================


-- ============================================================
-- ЧАСТЬ 1: ИСПРАВЛЕНИЕ ФУНКЦИЙ (search_path)
-- ============================================================

-- 1.1 handle_new_user — Триггер создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1.2 is_admin_or_above — Проверка роли (админ/суперадмин)
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

-- 1.3 is_super_admin — Проверка роли суперадмина
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


-- ============================================================
-- ЧАСТЬ 2: RLS-ПОЛИТИКИ ДЛЯ CLASSES
-- ============================================================

-- Удаляем ВСЕ старые политики на classes
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'classes' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.classes', pol.policyname);
  END LOOP;
END $$;

-- Убеждаемся что RLS включён
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- SELECT: Все авторизованные пользователи могут видеть классы
-- (ученик видит классы в которых состоит, учитель свои, но для поиска нужен доступ ко всем)
CREATE POLICY "Authenticated can view classes"
  ON public.classes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Только учителя и админы могут создавать классы
CREATE POLICY "Teachers and admins can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin', 'super_admin')
    )
  );

-- UPDATE: Только владелец класса или админы могут редактировать
CREATE POLICY "Owner or admin can update classes"
  ON public.classes FOR UPDATE
  USING (
    teacher_id = auth.uid() 
    OR is_admin_or_above()
  );

-- DELETE: Только владелец класса или админы могут удалять
CREATE POLICY "Owner or admin can delete classes"
  ON public.classes FOR DELETE
  USING (
    teacher_id = auth.uid() 
    OR is_admin_or_above()
  );


-- ============================================================
-- ЧАСТЬ 3: RLS-ПОЛИТИКИ ДЛЯ CLASS_MEMBERS
-- ============================================================

-- Удаляем ВСЕ старые политики на class_members
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'class_members' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.class_members', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Все авторизованные пользователи могут видеть участников класса
-- (нужно для лидерборда, статистики, списка учеников)
CREATE POLICY "Authenticated can view class members"
  ON public.class_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Учитель (владелец класса) может добавлять учеников, 
-- ученик может записать себя (вступить по коду), админы могут всех
CREATE POLICY "Teacher, student self, or admin can insert members"
  ON public.class_members FOR INSERT
  WITH CHECK (
    -- Ученик вступает сам (student_id = свой ID)
    student_id = auth.uid()
    -- Учитель добавляет ученика в свой класс
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
    -- Со-преподаватель добавляет ученика
    OR EXISTS (
      SELECT 1 FROM public.class_teachers
      WHERE class_id = class_members.class_id AND teacher_id = auth.uid()
    )
    -- Админы могут всех
    OR is_admin_or_above()
  );

-- DELETE: Учитель удаляет из своего класса, ученик выходит сам, админы
CREATE POLICY "Teacher, student self, or admin can delete members"
  ON public.class_members FOR DELETE
  USING (
    -- Ученик выходит сам
    student_id = auth.uid()
    -- Учитель удаляет из своего класса
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
    -- Со-преподаватель
    OR EXISTS (
      SELECT 1 FROM public.class_teachers
      WHERE class_id = class_members.class_id AND teacher_id = auth.uid()
    )
    -- Админы
    OR is_admin_or_above()
  );


-- ============================================================
-- ЧАСТЬ 4: RLS-ПОЛИТИКИ ДЛЯ COIN_TRANSACTIONS
-- ============================================================

-- Удаляем ВСЕ старые политики на coin_transactions
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'coin_transactions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.coin_transactions', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: Свои транзакции + учителя видят учеников своих классов + админы видят всё
CREATE POLICY "Users can view own coin transactions"
  ON public.coin_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view class students coins"
  ON public.coin_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      LEFT JOIN public.class_teachers ct ON ct.class_id = c.id
      WHERE cm.student_id = coin_transactions.user_id
        AND (c.teacher_id = auth.uid() OR ct.teacher_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all coin transactions"
  ON public.coin_transactions FOR SELECT
  USING (is_admin_or_above());

-- INSERT: Только свои транзакции (или серверные функции)
CREATE POLICY "Users can insert own coin transactions"
  ON public.coin_transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- ЧАСТЬ 5: ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================================

-- Классы
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id 
  ON public.classes(teacher_id);

-- Участники классов
CREATE INDEX IF NOT EXISTS idx_class_members_class_id 
  ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student_id 
  ON public.class_members(student_id);

-- Прогресс по урокам (дополнительный индекс)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson 
  ON public.user_lesson_progress(lesson_id);

-- Монетные транзакции
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user 
  ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created 
  ON public.coin_transactions(created_at);

-- Со-преподаватели
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher 
  ON public.class_teachers(teacher_id);


-- ============================================================
-- ГОТОВО!
-- ============================================================
-- После выполнения проверьте:
-- 1. Dashboard → Security Advisor — предупреждений должно стать меньше
-- 2. Войдите как ученик — убедитесь что видите классы и можете вступить
-- 3. Войдите как учитель — убедитесь что можете управлять классами
-- 4. Войдите как админ — убедитесь что видите все данные
-- ============================================================
