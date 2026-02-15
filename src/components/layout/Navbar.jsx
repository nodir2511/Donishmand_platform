import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';

const Navbar = ({ lang, setLang, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleLang = () => setLang(prev => prev === 'ru' ? 'tj' : 'ru');

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
                                if (window.location.pathname !== '/') {
                                    window.location.href = '/#courses-section';
                                } else {
                                    document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group"
                        >
                            {t.navCourses}
                            <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-accent -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                        </button>
                        <button
                            onClick={() => {
                                if (window.location.pathname !== '/') {
                                    window.location.href = '/#courses-section';
                                } else {
                                    document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group"
                        >
                            {t.navLibrary}
                            <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-accent -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                        </button>
                        <Link to="/" className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group">
                            {t.navAbout}
                            <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-accent -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                        </Link>
                        <Link to="/creator" className="px-5 py-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors relative group">
                            {t.navCreator}
                            <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gaming-accent -translate-x-1/2 group-hover:w-1/2 transition-all duration-300"></span>
                        </Link>
                        <div className="w-px h-4 bg-white/10 mx-2"></div>
                        <button
                            onClick={toggleLang}
                            className="px-3 py-1.5 text-xs font-bold bg-white/5 rounded-full text-white hover:bg-gaming-primary hover:text-white transition-colors uppercase ring-1 ring-white/10"
                        >
                            {lang}
                        </button>
                    </div>

                    {/* CTA и переключатель для мобильных */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block">
                            <Link to="/login" className="bg-gradient-to-r from-gaming-primary to-gaming-pink text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg shadow-gaming-primary/25 hover:shadow-gaming-pink/25 hover:scale-105 active:scale-95 inline-block">
                                {t.navLogin}
                            </Link>
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
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                if (window.location.pathname !== '/') {
                                    window.location.href = '/#courses-section';
                                } else {
                                    document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="text-left font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {t.navCourses}
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                if (window.location.pathname !== '/') {
                                    window.location.href = '/#courses-section';
                                } else {
                                    document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="text-left font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {t.navLibrary}
                        </button>
                        <Link to="/" onClick={() => setIsOpen(false)} className="font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                            {t.navAbout}
                        </Link>
                        <Link to="/creator" className="font-medium text-white/80 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                            {t.navCreator}
                        </Link>
                        <div className="border-t border-white/5 pt-4 flex items-center justify-between px-4">
                            <button onClick={toggleLang} className="px-3 py-1 bg-white/5 text-white rounded-md text-xs font-bold uppercase ring-1 ring-white/10">
                                {lang}
                            </button>
                            <Link to="/login" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gaming-primary">
                                {t.navLogin}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
