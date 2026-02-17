import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials are missing! Check your .env file.');
}

// Основной клиент — хранит сессию в localStorage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Клиент для создания пользователей — НЕ трогает localStorage
// Используется в AdminPage чтобы signUp() не перезаписывал текущую сессию
// Пустое хранилище — ничего не записывает и не читает
const memoryStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
};

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'sb-admin-create-user',
        storage: memoryStorage,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    }
});
