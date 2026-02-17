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
    // --- SWR: Синхронная инициализация из localStorage ---
    const getInitialState = () => {
        try {
            const cached = localStorage.getItem('sb-profile-cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                // Простая валидация (время жизни кеша, например 24 часа)
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    return {
                        user: { id: parsed.userId }, // Минимальный объект юзера
                        profile: parsed.profile,
                        permissions: parsed.permissions || [],
                        loading: false
                    };
                }
            }
        } catch (e) {
            console.error('Error reading initial cache', e);
        }
        return { user: null, profile: null, permissions: [], loading: true };
    };

    const initialState = getInitialState();

    const [user, setUser] = useState(initialState.user);
    const [profile, setProfile] = useState(initialState.profile);
    const [permissions, setPermissions] = useState(initialState.permissions);

    // Если данные были в кеше, то loading сразу false
    const [loading, setLoading] = useState(initialState.loading);

    // Флаг для блокировки onAuthStateChange при создании пользователей
    const skipAuthChangeRef = useRef(false);
    // Ref для хранения актуального ID (инициализируем тем, что достали из кеша)
    const userIdRef = useRef(initialState.user?.id || null);

    // Функция загрузки профиля (вынесена, чтобы вызывать её явно)
    const loadProfile = async (sessionUser) => {
        if (!sessionUser) return null;

        // Хелпер для таймаута запроса ( секунд)
        const requestWithTimeout = (promise, ms = 5000) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
            ]);
        };

        const finishLoad = async (data) => {
            let perms = [];
            // 3. Если учитель — грузим права
            if (data?.role === 'teacher') {
                const { data: p } = await supabase
                    .from('subject_permissions')
                    .select('subject_id, can_edit')
                    .eq('user_id', sessionUser.id);
                perms = p || [];
            }

            setPermissions(perms);

            // Сохраняем в кеш (SWR)
            try {
                if (data) {
                    localStorage.setItem('sb-profile-cache', JSON.stringify({
                        profile: data,
                        permissions: perms,
                        userId: sessionUser.id,
                        timestamp: Date.now()
                    }));
                    // // console.log('✅ Профиль обновлен в кеше');
                }
            } catch (e) {
                console.error('Ошибка сохранения кеша:', e);
            }

            return data;
        };

        try {
            // 1. Пробуем RPC (обходит RLS) с таймаутом
            try {
                let { data, error } = await requestWithTimeout(
                    supabase.rpc('get_my_profile'),
                    5000
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
            try {
                const { data, error } = await requestWithTimeout(
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', sessionUser.id)
                        .maybeSingle(),
                    10000
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

    useEffect(() => {
        let isMounted = true;
        let initAuthDone = false; // Флаг для предотвращения повторной загрузки

        // Инициализация авторизации: проверка сессии и загрузка профиля
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Если пользователь совпадает с кешем, мы НЕ ставим loading=true
                    const isSameUser = userIdRef.current === session.user.id;

                    if (!isSameUser) {
                        // Только если юзер другой, включаем загрузку
                        if (isMounted) setLoading(true);
                    }


                    // Актуализируем стейт юзера (вдруг в кеше был неполный объект)
                    if (isMounted) {
                        setUser(session.user);
                        userIdRef.current = session.user.id;
                    }

                    // Грузим свежие данные (в фоне или явно)
                    const profileData = await loadProfile(session.user);
                    if (isMounted) {
                        setProfile(profileData);
                    }
                } else {
                    // Нет сессии
                    if (isMounted) {
                        setUser(null);
                        userIdRef.current = null;
                        setProfile(null);
                        setPermissions([]);
                    }
                }
            } catch (error) {
                console.error("Ошибка при инициализации auth:", error);
            } finally {
                if (isMounted) {
                    initAuthDone = true;
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Подписка на изменения (login, logout, refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (skipAuthChangeRef.current) return;
            if (!isMounted) return;

            // Логируем событие для отладки
            // console.log(`Auth Event: ${event}`, session?.user?.email);

            if (event === 'SIGNED_OUT') {
                setUser(null);
                userIdRef.current = null;
                setProfile(null);
                setPermissions([]);
                setLoading(false);
            }
            else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                const isUserChanged = session?.user && session.user.id !== userIdRef.current;

                // Если юзер сменился - грузим.
                // Если тот же самый - ничего не делаем (initAuth или предыдущий стейт уже всё сделали)
                if (isUserChanged) {
                    // Если initAuth ещё идет, он сам всё сделает, но на всякий случай проверяем
                    if (initAuthDone && userIdRef.current === session.user.id) return;

                    setLoading(true);
                    setUser(session.user);
                    userIdRef.current = session.user.id;
                    const profileData = await loadProfile(session.user);
                    if (isMounted) {
                        setProfile(profileData);
                        setLoading(false);
                    }
                }
            }
        });

        // Таймаут безопасности 10 сек (на случай если initAuth зависнет)
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                setLoading(prev => {
                    if (prev) {
                        console.warn('⚠️ Safety timeout logic triggered');
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

    const signOut = async () => {
        forceCleanup();
        setUser(null);
        setProfile(null);
        try {
            await Promise.race([
                supabase.auth.signOut(),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
        } catch (e) {
            console.error("SignOut error (ignored):", e);
        }
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
        setSkipAuthChange: (value) => { skipAuthChangeRef.current = value; },
        canEditSubject: (subjectId) => {
            if (profile?.role === 'super_admin') return true;
            if (profile?.role === 'teacher') {
                return permissions.some(p => p.subject_id === subjectId && p.can_edit);
            }
            return false;
        },
        canViewSubject: (subjectId) => {
            if (profile?.role === 'super_admin' || profile?.role === 'admin') return true;
            if (profile?.role === 'teacher') return profile?.subject === subjectId;
            return true;
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-gaming-bg">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-gaming-primary/30 border-t-gaming-primary rounded-full animate-spin" />
                        <span className="text-gaming-textMuted text-sm">Загрузка...</span>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
