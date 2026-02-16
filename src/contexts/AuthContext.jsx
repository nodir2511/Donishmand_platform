import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Утилита: Принудительная очистка всех данных Supabase из браузера
const forceCleanup = () => {
    // Удаляем все ключи Supabase из localStorage
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
        }
    });
    // Также чистим sessionStorage на всякий случай
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-')) {
            sessionStorage.removeItem(key);
        }
    });
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkUser = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error || !user) {
                    // Пользователь не найден на сервере — чистим локальные данные
                    forceCleanup();
                    if (isMounted) {
                        setUser(null);
                        setProfile(null);
                    }
                } else {
                    if (isMounted) setUser(user);

                    // Загружаем профиль
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profileError || !profileData) {
                        console.warn('Профиль не найден:', profileError?.message);
                        // Профиль отсутствует — выходим принудительно
                        forceCleanup();
                        try { await supabase.auth.signOut(); } catch (e) { /* игнорируем */ }
                        if (isMounted) {
                            setUser(null);
                            setProfile(null);
                        }
                    } else {
                        if (isMounted) setProfile(profileData);
                    }
                }
            } catch (error) {
                console.error('Ошибка проверки сессии:', error);
                forceCleanup();
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        checkUser();

        // Слушаем изменения авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth event:", event);

            if (event === 'SIGNED_OUT' || !session?.user) {
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
                return;
            }

            if (isMounted) {
                setUser(session.user);
                // Загружаем профиль
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setProfile(data || null);
                setLoading(false);
            }
        });

        // Таймаут безопасности
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                setLoading(prev => {
                    if (prev) {
                        console.warn('Auth timeout — принудительная загрузка');
                        return false;
                    }
                    return prev;
                });
            }
        }, 3000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    // Выход из системы — жёстко и надёжно
    const signOut = async () => {
        // 1. Сначала чистим ВСЕ локальные данные
        forceCleanup();
        setUser(null);
        setProfile(null);

        // 2. Пробуем выйти на сервере (но не ждём долго)
        try {
            await Promise.race([
                supabase.auth.signOut(),
                new Promise(resolve => setTimeout(resolve, 2000)) // Не ждём больше 2 сек
            ]);
        } catch (e) {
            console.error("SignOut error (ignored):", e);
        }

        // 3. Жёсткая перезагрузка — гарантирует полный сброс
        window.location.href = '/';
    };

    const value = {
        user,
        profile,
        loading,
        signOut,
        isAuthenticated: !!user,
        isTeacher: profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin',
        isSuperAdmin: profile?.role === 'super_admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-gaming-bg">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-gaming-primary/30 border-t-gaming-primary rounded-full animate-spin" />
                        <span className="text-gaming-textMuted text-sm">Инициализация...</span>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
