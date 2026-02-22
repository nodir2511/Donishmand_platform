-- ====================================================================
-- Скрипт миграции: Настройки класса и несколько преподавателей
-- ====================================================================

-- 1. Добавление новых полей в таблицу classes
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS invite_code text UNIQUE,
ADD COLUMN IF NOT EXISTS description text;

-- 2. Создание таблицы class_teachers (Со-преподаватели)
CREATE TABLE IF NOT EXISTS public.class_teachers (
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    added_at timestamptz DEFAULT now(),
    PRIMARY KEY (class_id, teacher_id)
);

-- 3. Включение Row Level Security (RLS)
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- 4. Политики безопасности (Policies) для class_teachers

-- Любой авторизованный пользователь может видеть список преподавателей класса
CREATE POLICY "Everyone can view class_teachers" 
ON public.class_teachers FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Добавлять со-преподавателей могут только учителя и админы
CREATE POLICY "Teachers and admins can insert class_teachers" 
ON public.class_teachers FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('teacher', 'admin', 'super_admin')
    )
);

-- Удалять со-преподавателей может только создатель класса (classes.teacher_id), 
-- либо сам со-преподаватель (чтобы выйти из класса), либо админы.
-- Мы упростим проверку на стороне БД до уровня авторизации, 
-- а точную бизнес-логику будем проверять на стороне клиента и в сервисе.
CREATE POLICY "Authorized users can delete class_teachers" 
ON public.class_teachers FOR DELETE 
USING (
    auth.uid() = teacher_id OR -- Может удалить себя
    EXISTS (
        SELECT 1 FROM public.classes 
        WHERE id = class_id AND teacher_id = auth.uid() -- Создатель класса
    ) OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin') -- Админы
    )
);

-- ====================================================================
-- Конец скрипта
-- ====================================================================
