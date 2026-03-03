-- Добавление недостающего столбца для детальных ответов
ALTER TABLE public.user_test_results 
ADD COLUMN IF NOT EXISTS answers_detail JSONB DEFAULT '[]'::jsonb;

-- Создание таблицы транзакций монет (если её нет)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Настройка политик безопасности для монет (только чтение для пользователя)
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'coin_transactions' AND policyname = 'Users can view own transactions'
    ) THEN
        CREATE POLICY "Users can view own transactions" 
        ON public.coin_transactions FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;
