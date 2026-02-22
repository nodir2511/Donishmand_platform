-- ============================================================
-- SQL Script: Create Branches Schema (Филиалы)
-- RUN IN SUPABASE SQL EDITOR
-- ============================================================

-- 1. Создание таблицы филиалов
CREATE TABLE IF NOT EXISTS public.branches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- 2. Включаем RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Everyone can view branches" ON public.branches;
DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;

-- 3. Политики безопасности (RLS)
-- Все могут просматривать список филиалов (для выбора)
CREATE POLICY "Everyone can view branches" 
    ON public.branches FOR SELECT 
    USING (true);

-- Только админы могут добавлять, изменять и удалять филиалы
CREATE POLICY "Admins can manage branches" 
    ON public.branches FOR ALL 
    USING (is_admin_or_above());

-- 4. Добавление связи в таблицу классов
-- ВНИМАНИЕ: Если таблица classes пересоздается, добавьте эту колонку в основной скрипт
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Готово!
