-- Добавление subject_id к классам и создание таблиц прогресса

-- 1. Добавляем предмет к классу
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS subject_id text;

-- 2. Таблица результатов тестов (попытки)
CREATE TABLE IF NOT EXISTS public.user_test_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id text NOT NULL, -- Привязка к уроку, так как тесты лежат внутри уроков
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    correct_count integer NOT NULL DEFAULT 0,
    total_questions integer NOT NULL DEFAULT 0,
    is_passed boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Индексы для быстрого поиска статистики
CREATE INDEX IF NOT EXISTS idx_test_results_user ON public.user_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_lesson ON public.user_test_results(lesson_id);

-- Политики (RLS) для тестов
ALTER TABLE public.user_test_results ENABLE ROW LEVEL SECURITY;

-- Ученики могут видеть свои результаты и добавлять новые
CREATE POLICY "Users can view own test results" ON public.user_test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test results" ON public.user_test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Админы/учителя (в будущем через view/rpc) смогут читать все

-- 3. Таблица прогресса по урокам (видео, текст, слайды)
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id text NOT NULL,
    video_watched boolean DEFAULT false,
    text_read boolean DEFAULT false,
    slides_viewed_count integer DEFAULT 0,
    total_slides integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.user_lesson_progress(user_id);

-- Политики (RLS) для прогресса
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson progress" ON public.user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON public.user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON public.user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);
