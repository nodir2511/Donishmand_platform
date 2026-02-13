import React from 'react';
import { ArrowRight, Sparkles, Calculator, Atom } from 'lucide-react';

const HeroSection = ({ lang, t }) => {
    return (
        <div className="relative w-full overflow-hidden pt-36 pb-20 lg:pt-48 lg:pb-32">

            {/* Фоновое свечение окружения */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gaming-primary/20 rounded-full blur-[150px] pointer-events-none translate-x-1/3 -translate-y-1/3 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gaming-pink/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/3 animate-pulse-slow"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">

                {/* Бейдж */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm text-gaming-accent text-sm font-medium mb-8 animate-fade-in-up">
                    <Sparkles size={16} className="text-gaming-gold" />
                    <span className="tracking-wide uppercase text-[11px] font-bold">{t.badge}</span>
                </div>

                {/* Заголовок */}
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1] animate-fade-in-up delay-[100ms] drop-shadow-2xl">
                    {t.heroTitle}
                </h1>

                {/* Подзаголовок */}
                <p className="text-lg md:text-xl text-gaming-textMuted mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-[200ms]">
                    {t.heroSubtitle}
                </p>

                {/* Кнопки */}
                <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full animate-fade-in-up delay-[300ms]">
                    {/* Основная кнопка */}
                    <button className="group relative bg-gaming-primary hover:bg-gaming-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-gaming-primary/25 flex items-center justify-center gap-2 text-lg overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <span>{t.ctaStart}</span>
                        <ArrowRight size={20} className="text-gaming-gold group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Вторичная кнопка */}
                    <button className="group bg-transparent hover:bg-white/5 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-lg backdrop-blur-sm">
                        {t.ctaCatalog}
                    </button>
                </div>

                {/* Плавающие 3D элементы (иконки) */}
                <div className="absolute top-1/2 left-10 hidden lg:block animate-float opacity-30">
                    <Calculator size={80} className="text-gaming-accent rotate-12 drop-shadow-[0_0_15px_rgba(0,224,255,0.5)]" />
                </div>
                <div className="absolute top-1/3 right-10 hidden lg:block animate-float opacity-30" style={{ animationDelay: '2s' }}>
                    <Atom size={80} className="text-gaming-pink -rotate-12 drop-shadow-[0_0_15px_rgba(255,73,219,0.5)]" />
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
