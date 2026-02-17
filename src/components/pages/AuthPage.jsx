import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';

const AuthPage = () => {
    const { t, i18n } = useTranslation();
    const isRu = i18n.resolvedLanguage === 'ru';
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Данные формы
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        birthDate: '',
        phone: '',
        role: 'student', // По умолчанию ученик
        language: 'tj',
        grade: '1',
        school: '',
        branch: '',
        group: '',
        subject: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.type === 'checkbox' ? 'checked' : 'value']: e.target.value });
        setError(null);
    };

    // Helper: Timeout promise
    const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));

    // Отправка формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Race condition: Auth call vs 10s timeout
            if (isLogin) {
                // 1. Вход
                const { data, error } = await Promise.race([
                    supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password,
                    }),
                    timeoutPromise(10000)
                ]);

                if (error) throw error;

                // Перенаправление (если были где-то, иначе домой)
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
            } else {
                // 2. Регистрация
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Пароли не совпадают');
                }

                if (formData.password.length < 6) {
                    throw new Error('Пароль должен быть не менее 6 символов');
                }

                // Создаем пользователя в Auth с metadata (триггер создаст базовый профиль)
                const { data: authData, error: authError } = await Promise.race([
                    supabase.auth.signUp({
                        email: formData.email,
                        password: formData.password,
                        options: {
                            data: {
                                full_name: formData.fullName,
                                role: formData.role,
                            }
                        }
                    }),
                    timeoutPromise(10000)
                ]);

                if (authError) throw authError;

                if (authData.user) {
                    // Базовый профиль уже создан триггером в БД (public.handle_new_user)
                    // Мы просто обновляем его дополнительными данными из формы

                    const profileUpdates = {
                        birth_date: formData.birthDate || null,
                        phone: formData.phone || null,
                        branch: formData.branch || null,
                        updated_at: new Date().toISOString(),
                    };

                    // Поля для ученика
                    if (formData.role === 'student') {
                        profileUpdates.school = formData.school || null;
                        profileUpdates.grade = formData.grade ? parseInt(formData.grade) : null;
                        profileUpdates.group_name = formData.group || null;
                        profileUpdates.language = formData.language || 'tj';
                    }

                    // Поля для учителя
                    if (formData.role === 'teacher') {
                        profileUpdates.subject = formData.subject || null;
                    }

                    // Обновляем существующий профиль (который только что создал триггер)
                    // Используем update вместо upsert, чтобы подтвердить существование записи
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update(profileUpdates)
                        .eq('id', authData.user.id);

                    if (profileError) {
                        console.error('Ошибка обновления профиля:', profileError);
                        // Если профиль вдруг не найден (триггер не сработал), пробуем создать вручную (fallback)
                        if (profileError.code === 'PGRST116' || profileError.details?.includes('0 rows')) {
                            console.warn('Профиль не найден, создаем вручную (fallback)...');
                            await supabase.from('profiles').insert({
                                id: authData.user.id,
                                full_name: formData.fullName,
                                role: formData.role,
                                email: formData.email,
                                ...profileUpdates
                            });
                        }
                    }

                    // Переход на главную
                    navigate('/');
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
            let message = err.message;
            if (message === 'Invalid login credentials') {
                message = isRu ? 'Неверный email или пароль' : 'Email ё парол нодуруст';
            } else if (message === 'Request timed out') {
                message = isRu ? 'Превышено время ожидания. Проверьте интернет.' : 'Вақти интизорӣ гузашт. Интернетро санҷед.';
            } else if (message.includes('rate limit')) {
                message = isRu
                    ? 'Слишком много попыток. Подождите 10-15 минут и попробуйте снова.'
                    : 'Кӯшишҳо аз ҳад зиёд. 10-15 дақиқа интизор шавед ва боз кӯшиш кунед.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-10 px-4">

            {/* Фоновые эффекты */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gaming-primary/20 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gaming-pink/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3 animate-pulse-slow"></div>

            <div className="w-full max-w-2xl relative z-10 animate-fade-in-up">

                {/* Логотип над формой */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-gaming-primary to-gaming-pink rounded-2xl flex items-center justify-center shadow-lg shadow-gaming-primary/20 group-hover:scale-105 transition-transform duration-300">
                            <Sparkles className="text-white w-7 h-7" />
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-white">
                            Donishmand
                        </span>
                    </Link>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden">
                    {/* Декоративная линия сверху */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gaming-primary via-gaming-accent to-gaming-pink opacity-50"></div>

                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                        {isLogin ? t('authLoginTitle') : t('authRegisterTitle')}
                    </h2>
                    <p className="text-white/60 text-center mb-8 text-sm">
                        {isLogin
                            ? (isRu ? 'Войдите, чтобы продолжить обучение' : 'Барои идомаи таълим ворид шавед')
                            : (isRu ? 'Присоединяйтесь к лучшей платформе' : 'Ба беҳтарин платформа ҳамроҳ шавед')
                        }
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection Hook */}
                        {!isLogin && (
                            <div className="flex bg-gaming-bg/50 p-1 rounded-xl mb-6 border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'student' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.role === 'student'
                                        ? 'bg-gaming-card shadow-lg text-white border border-white/10'
                                        : 'text-gaming-textMuted hover:text-white'
                                        }`}
                                >
                                    {t('authRoleStudent')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'teacher' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.role === 'teacher'
                                        ? 'bg-gaming-card shadow-lg text-white border border-white/10'
                                        : 'text-gaming-textMuted hover:text-white'
                                        }`}
                                >
                                    {t('authRoleTeacher')}
                                </button>
                            </div>
                        )}

                        {/* ФИО (Только регистрация) */}
                        {!isLogin && (
                            <div className="space-y-1.5 animate-fade-in-up">
                                <label className="text-sm font-medium text-white/60 ml-1">
                                    {t('authFullName')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-gaming-primary transition-colors">
                                        <UserPlus size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        placeholder={isRu ? "Эшматов Тошмат" : "Алиев Вали"}
                                        required
                                        pattern="^[А-Яа-яЁё\s]+$"
                                        title={t('authErrCyrillic')}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Дата рождения и Телефон (Только регистрация) */}
                        {!isLogin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-[50ms]">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t('authBirthDate')}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans [color-scheme:dark]"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t('authPhone')}
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        placeholder="+992 00 000 0000"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-white/60 ml-1">
                                {t('authEmail')}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-gaming-primary transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* STUDENT FIELDS */}
                        {!isLogin && formData.role === 'student' && (
                            <>
                                {/* Язык и Класс */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-[100ms]">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-white/60 ml-1">
                                            {t('authLanguage')}
                                        </label>
                                        <select
                                            value={formData.language}
                                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                            className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans appearance-none cursor-pointer"
                                        >
                                            <option value="tj">{t('authLangTj')}</option>
                                            <option value="ru">{t('authLangRu')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-white/60 ml-1">
                                            {t('authGrade')}
                                        </label>
                                        <select
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                            className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans appearance-none cursor-pointer"
                                        >
                                            {[...Array(11)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Школа, Филиал, Группа */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-[150ms]">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-white/60 ml-1">
                                            {t('authSchool')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.school}
                                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                            className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                            placeholder={isRu ? "№1" : "№1"}
                                            required={formData.role === 'student'}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gaming-textMuted ml-1">
                                            {t('authBranch')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                            className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                            required={formData.role === 'student'}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gaming-textMuted ml-1">
                                            {t('authGroup')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.group}
                                            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                            className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                            required={formData.role === 'student'}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* TEACHER FIELDS */}
                        {!isLogin && formData.role === 'teacher' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-[100ms]">
                                {/* Предмет */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t('authSubject')}
                                    </label>
                                    <select
                                        value={formData.subject || 'tj-lang'}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans appearance-none cursor-pointer"
                                    >
                                        <option value="tj-lang">Таджикский язык</option>
                                        <option value="math">Математика</option>
                                        <option value="phys">Физика</option>
                                        <option value="chem">Химия</option>
                                        <option value="bio">Биология</option>
                                        <option value="geo">География</option>
                                        <option value="hist">История</option>
                                        <option value="eng">Английский</option>
                                        <option value="lit">Литература</option>
                                    </select>
                                </div>
                                {/* Филиал */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t('authBranch')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        required={formData.role === 'teacher'}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gaming-textMuted ml-1">
                                {t('authPassword')}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gaming-textMuted group-focus-within:text-gaming-primary transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gaming-textMuted hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (только для регистрации) */}
                        {!isLogin && (
                            <div className="space-y-1.5 animate-fade-in-up delay-[200ms]">
                                <label className="text-sm font-medium text-gaming-textMuted ml-1">
                                    {t('authConfirmPassword')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gaming-textMuted group-focus-within:text-gaming-primary transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Forgot Password (только для входа) */}
                        {isLogin && (
                            <div className="flex justify-end">
                                <button type="button" className="text-xs text-gaming-primary hover:text-gaming-accent transition-colors font-medium">
                                    {t('authForgotPass')}
                                </button>
                            </div>
                        )}

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-gaming-primary to-gaming-pink hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gaming-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                            {loading
                                ? (isRu ? 'Обработка...' : ' коркард...')
                                : (isLogin ? t('authLoginBtn') : t('authRegisterBtn'))
                            }
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    {/* Switcher */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-gaming-textMuted text-sm mb-3">
                            {isLogin ? t('authNoAccount') : t('authHasAccount')}
                        </p>
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className="text-white font-semibold hover:text-gaming-accent transition-colors text-sm px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                            {isLogin ? t('authSwitchToRegister') : t('authSwitchToLogin')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
