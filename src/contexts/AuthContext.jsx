import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
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
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Флаг для блокировки onAuthStateChange при создании пользователей
    const skipAuthChangeRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        // Функция загрузки профиля
        const loadProfile = async (sessionUser) => {
            if (!sessionUser) return null;

            // Хелпер для таймаута запроса (3 секунды)
            const requestWithTimeout = (promise, ms = 3000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
                ]);
            };

            const finishLoad = async (data) => {
                // 3. Если учитель — грузим права
                if (data.role === 'teacher') {
                    const { data: perms } = await supabase
                        .from('subject_permissions')
                        .select('subject_id, can_edit')
                        .eq('user_id', sessionUser.id);
                    if (isMounted) setPermissions(perms || []);
                } else {
                    if (isMounted) setPermissions([]);
                }
                return data;
            };

            try {
                // 1. Пробуем RPC (обходит RLS) с таймаутом
                try {
                    let { data, error } = await requestWithTimeout(
                        supabase.rpc('get_my_profile'),
                        3000
                    );

                    // RPC возвращает массив
                    if (data && data.length > 0) data = data[0];
                    else if (!error && (!data || data.length === 0)) data = null;

                    if (data && !error) {
                        return await finishLoad(data);
                    }
                } catch (e) {
                    // Ignore RPC timeout/error and proceed to fallback
                }

                // 2. Fallback: Прямой запрос (Direct Select)
                // Если RPC завис или упал, пробуем обычный select (он работает через RLS)
                try {
                    const { data, error } = await requestWithTimeout(
                        supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', sessionUser.id)
                            .maybeSingle(),
                        3000
                    );

                    if (data && !error) {
                        return await finishLoad(data);
                    }
                    if (error) console.error('Direct Select Error:', error);

                } catch (e) {
                    console.error('Direct select timed out:', e);
                }

            } catch (err) {
                console.error('Ошибка загрузки профиля (Global):', err);
            }
            return null;
        };

        // ЕДИНАЯ точка входа для состояния авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (skipAuthChangeRef.current) return;

            if (!isMounted) return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setPermissions([]);
                setLoading(false);
            }
            else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (session?.user) {
                    // Если пользователь поменялся или это первая загрузка
                    if (session.user.id !== user?.id) {
                        setUser(session.user);
                    }

                    // Важно: не убираем loading, пока не загрузим профиль!
                    const profileData = await loadProfile(session.user);

                    if (isMounted) {
                        setProfile(profileData);
                        setLoading(false); // Только теперь снимаем экран загрузки
                    }
                } else {
                    // Странный кейс: событие входа есть, а юзера нет
                    setLoading(false);
                }
            }
        });

        // Таймаут безопасности 10 сек (по просьбе пользователя)
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                setLoading(prev => {
                    if (prev) {
                        return false;
                    }
                    return prev;
                });
            }
        }, 10000);

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
        permissions,
        loading,
        signOut,
        isAuthenticated: !!user,
        isTeacher: profile?.role === 'teacher',
        isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
        isSuperAdmin: profile?.role === 'super_admin',
        // Управление блокировкой onAuthStateChange
        setSkipAuthChange: (value) => { skipAuthChangeRef.current = value; },
        // Проверка: может ли текущий пользователь редактировать предмет
        canEditSubject: (subjectId) => {
            if (profile?.role === 'super_admin') return true;
            if (profile?.role === 'teacher') {
                return permissions.some(p => p.subject_id === subjectId && p.can_edit);
            }
            return false;
        },
        // Проверка: может ли пользователь просматривать предмет
        canViewSubject: (subjectId) => {
            if (profile?.role === 'super_admin' || profile?.role === 'admin') return true;
            if (profile?.role === 'teacher') return profile?.subject === subjectId;
            // Ученик — по кластеру
            return true; // Фильтрация на уровне HomePage
        },
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
