import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, User, LogOut, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const { user, profile, signOut, permissions } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleLang = () => {
        const newLang = i18n.resolvedLanguage === 'ru' ? 'tj' : 'ru';
        i18n.changeLanguage(newLang);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
        setShowProfileMenu(false);
        setIsOpen(false);
    };

    const currentLang = i18n.resolvedLanguage || 'ru';
    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email?.[0].toUpperCase() || 'U';

    // Отображение названия роли
    const getRoleName = (role) => {
        switch (role) {
            case 'super_admin': return t('profilePage.roleSuperAdmin');
            case 'admin': return t('profilePage.roleAdmin');
            case 'teacher': return t('profilePage.roleTeacher');
            default: return t('studentRole');
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gaming-bg/80 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Логотип */}
                    <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-gaming-primary to-gaming-pink rounded-xl flex items-center justify-center shadow-lg shadow-gaming-primary/20 group-hover:scale-105 transition-transform duration-300">
                            <Sparkles className="text-white w-6 h-6" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gaming-primary/80 transition-all">
                            Donishmand
                        </span>
                    </Link>

                    {/* Навигация для десктопа */}
                    <div className="hidden md:flex items-center bg-white/5 backdrop-blur-md rounded-full border border-white/5 p-1.5 shadow-sm">
                        <button
                            onClick={() => {
                                if (location.pathname !== '/') {
                                    navigate({ pathname: '/', hash: '#courses-section' });
                                } else {
                                    document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group"
                        >
                            {t('navCourses')}
                            <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-accent -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                        </button>

                        <Link to="/" className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group">
                            {t('navAbout')}
                            <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-accent -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                        </Link>

                        {/* Ссылка Классы: для всех авторизованных (Ученики видят "Мой класс", учителя "Классы") */}
                        {user && (
                            <Link to="/classes" className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group border-l border-white/10 ml-2 pl-6">
                                {profile?.role === 'student' ? 'Мои классы' : 'Классы'}
                                <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-purple -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                            </Link>
                        )}

                        {/* Ссылка Creator: суперадмин или учитель с правами на редактирование */}
                        {(profile?.role === 'super_admin' || (profile?.role === 'teacher' && permissions?.some(p => p.can_edit))) && (
                            <Link to="/creator" className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group">
                                {t('navCreator')}
                                <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-accent -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                            </Link>
                        )}

                        {/* Ссылка Admin: админ или суперадмин */}
                        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                            <Link to="/admin" className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group">
                                {t('navAdmin')}
                                <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-red-500 -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                            </Link>
                        )}

                        <div className="w-px h-4 bg-white/10 mx-2"></div>
                        <button
                            onClick={toggleLang}
                            className="px-3 py-1.5 text-xs font-bold bg-white/5 rounded-full text-white hover:bg-gaming-primary hover:text-white transition-colors uppercase ring-1 ring-white/10"
                        >
                            {currentLang}
                        </button>
                    </div>

                    {/* CTA и User Menu */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block">
                            {user ? (
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="flex items-center gap-3 pl-1 pr-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gaming-primary to-gaming-purple flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                            {userInitials}
                                        </div>
                                        <div className="text-left hidden lg:block">
                                            <div className="text-xs font-bold text-white leading-none mb-0.5">{profile?.full_name || user.email}</div>
                                            <div className="text-[10px] text-gaming-textMuted uppercase tracking-wider leading-none">
                                                {getRoleName(profile?.role)}
                                            </div>
                                        </div>
                                        <ChevronDown size={14} className={`text-gaming-textMuted transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showProfileMenu && (
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-gaming-card border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-in-up origin-top-right backdrop-blur-xl">
                                            <div className="px-4 py-3 border-b border-white/5 lg:hidden">
                                                <p className="text-sm font-bold text-white truncate">{profile?.full_name || user.email}</p>
                                                <p className="text-xs text-gaming-textMuted mt-0.5 uppercase tracking-wider">
                                                    {getRoleName(profile?.role)}
                                                </p>
                                            </div>

                                            <div className="py-1">
                                                <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gaming-textMuted hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors">
                                                    <User size={16} />
                                                    {t('profile')}
                                                </button>
                                                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                                                    <LogOut size={16} />
                                                    {t('logout')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="bg-gradient-to-r from-gaming-primary to-gaming-pink text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg shadow-gaming-primary/25 hover:shadow-gaming-pink/25 hover:scale-105 active:scale-95 inline-block">
                                    {t('navLogin')}
                                </Link>
                            )}
                        </div>

                        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Мобильное меню */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-gaming-card border-b border-white/5 p-4 shadow-xl md:hidden glass-panel">
                    <div className="flex flex-col gap-4">
                        {user && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gaming-primary to-gaming-purple flex items-center justify-center text-white font-bold shadow-inner">
                                    {userInitials}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-white truncate">{profile?.full_name || user.email}</div>
                                    <div className="text-xs text-gaming-textMuted uppercase tracking-wider">
                                        {getRoleName(profile?.role)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                if (location.pathname !== '/') {
                                    navigate({ pathname: '/', hash: '#courses-section' });
                                } else {
                                    document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="text-left font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {t('navCourses')}
                        </button>

                        <Link to="/" onClick={() => setIsOpen(false)} className="font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                            {t('navAbout')}
                        </Link>

                        {/* Ссылка Классы (мобильное) */}
                        {user && (
                            <Link to="/classes" onClick={() => setIsOpen(false)} className="font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors border-l-2 border-gaming-purple ml-2">
                                {profile?.role === 'student' ? 'Мои классы' : 'Классы'}
                            </Link>
                        )}

                        {/* Ссылка Creator (мобильное): суперадмин или учитель с правами */}
                        {(profile?.role === 'super_admin' || (profile?.role === 'teacher' && permissions?.some(p => p.can_edit))) && (
                            <Link to="/creator" onClick={() => setIsOpen(false)} className="font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                                {t('navCreator')}
                            </Link>
                        )}

                        {/* Ссылка Admin (мобильное): админ или суперадмин */}
                        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                            <Link to="/admin" onClick={() => setIsOpen(false)} className="font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                                {t('navAdmin')}
                            </Link>
                        )}

                        <div className="border-t border-white/5 pt-4 flex items-center justify-between px-4">
                            <button onClick={toggleLang} className="px-3 py-1 bg-white/5 text-white rounded-md text-xs font-bold uppercase ring-1 ring-white/10">
                                {currentLang}
                            </button>

                            {user ? (
                                <button onClick={handleLogout} className="text-sm font-medium text-red-400 flex items-center gap-2">
                                    <LogOut size={16} />
                                    {t('logout')}
                                </button>
                            ) : (
                                <Link to="/login" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gaming-primary">
                                    {t('navLogin')}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
