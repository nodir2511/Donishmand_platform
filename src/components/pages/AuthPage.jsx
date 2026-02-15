import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const AuthPage = ({ lang, t }) => {
    const isRu = lang === 'ru';
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Заглушка для отправки формы
    const handleSubmit = (e) => {
        e.preventDefault();
        // В будущем здесь будет вызов Supabase Auth
        console.log("Auth attempt:", isLogin ? "Login" : "Register");
        // После успешного входа:
        // navigate('/');
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
                        {isLogin ? t.authLoginTitle : t.authRegisterTitle}
                    </h2>
                    <p className="text-white/60 text-center mb-8 text-sm">
                        {isLogin
                            ? (isRu ? 'Войдите, чтобы продолжить обучение' : 'Барои идомаи таълим ворид шавед')
                            : (isRu ? 'Присоединяйтесь к лучшей платформе' : 'Ба беҳтарин платформа ҳамроҳ шавед')
                        }
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ФИО (Только регистрация) */}
                        {!isLogin && (
                            <div className="space-y-1.5 animate-fade-in-up">
                                <label className="text-sm font-medium text-white/60 ml-1">
                                    {t.authFullName}
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-gaming-primary transition-colors">
                                        <UserPlus size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        placeholder={isRu ? "Эшматов Тошмат" : "Алиев Вали"}
                                        required
                                        pattern="^[А-Яа-яЁё\s]+$"
                                        title={t.authErrCyrillic}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Дата рождения и Телефон (Только регистрация) */}
                        {!isLogin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-[50ms]">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t.authBirthDate}
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans [color-scheme:dark]"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t.authPhone}
                                    </label>
                                    <input
                                        type="tel"
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
                                {t.authEmail}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-gaming-primary transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Язык и Класс (Только регистрация) */}
                        {!isLogin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-[100ms]">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t.authLanguage}
                                    </label>
                                    <select className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans appearance-none cursor-pointer">
                                        <option value="tj">{t.authLangTj}</option>
                                        <option value="ru">{t.authLangRu}</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t.authGrade}
                                    </label>
                                    <select className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans appearance-none cursor-pointer">
                                        {[...Array(11)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Школа, Филиал, Группа (Только регистрация) */}
                        {!isLogin && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-[150ms]">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/60 ml-1">
                                        {t.authSchool}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-gaming-bg/50 border border-white/20 rounded-xl py-3.5 px-4 text-white placeholder-white/50 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        placeholder={isRu ? "№1" : "№1"}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gaming-textMuted ml-1">
                                        {t.authBranch}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gaming-textMuted ml-1">
                                        {t.authGroup}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-gaming-primary/50 focus:ring-1 focus:ring-gaming-primary/50 transition-all font-sans"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gaming-textMuted ml-1">
                                {t.authPassword}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gaming-textMuted group-focus-within:text-gaming-primary transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
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
                                    {t.authConfirmPassword}
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gaming-textMuted group-focus-within:text-gaming-primary transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
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
                                    {t.authForgotPass}
                                </button>
                            </div>
                        )}

                        {/* Button */}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-gaming-primary to-gaming-pink hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gaming-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2"
                        >
                            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                            {isLogin ? t.authLoginBtn : t.authRegisterBtn}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* Switcher */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-gaming-textMuted text-sm mb-3">
                            {isLogin ? t.authNoAccount : t.authHasAccount}
                        </p>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-white font-semibold hover:text-gaming-accent transition-colors text-sm px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                            {isLogin ? t.authSwitchToRegister : t.authSwitchToLogin}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
