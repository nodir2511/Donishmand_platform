import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, BookOpen, Users, Award, GraduationCap, ArrowRight } from 'lucide-react';

const AboutPage = () => {
    const { t } = useTranslation();

    return (
        <div className="relative min-h-screen">
            {/* Фоновые эффекты */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gaming-primary/15 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gaming-pink/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3 animate-pulse-slow" />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gaming-accent/5 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Заголовок */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gaming-primary/10 border border-gaming-primary/20 rounded-full text-gaming-primary text-sm font-medium mb-6">
                        <Sparkles size={16} />
                        {t('about.badge')}
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold font-heading text-white mb-6 leading-tight">
                        <span className="text-gradient">{t('about.titleHighlight')}</span>
                        <br />
                        {t('about.titleRest')}
                    </h1>
                    <p className="text-gaming-textMuted text-lg max-w-2xl mx-auto leading-relaxed">
                        {t('about.subtitle')}
                    </p>
                </div>

                {/* Карточки преимуществ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {[
                        { icon: BookOpen, color: 'gaming-primary', key: 'content' },
                        { icon: Users, color: 'gaming-accent', key: 'teachers' },
                        { icon: Award, color: 'gaming-gold', key: 'quality' },
                        { icon: GraduationCap, color: 'gaming-pink', key: 'students' },
                    ].map(({ icon: Icon, color, key }, i) => (
                        <div
                            key={key}
                            className="glass-panel rounded-2xl p-6 hover:border-white/10 transition-all group animate-fade-in-up"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon size={24} className={`text-${color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 font-heading">
                                {t(`about.${key}Title`)}
                            </h3>
                            <p className="text-gaming-textMuted leading-relaxed">
                                {t(`about.${key}Text`)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="glass-panel rounded-3xl p-10 border border-gaming-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gaming-primary via-gaming-accent to-gaming-pink opacity-60" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-heading">
                            {t('about.ctaTitle')}
                        </h2>
                        <p className="text-gaming-textMuted mb-8 max-w-lg mx-auto">
                            {t('about.ctaText')}
                        </p>
                        <Link
                            to="/#courses-section"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gaming-primary to-gaming-pink text-white font-bold rounded-xl shadow-lg shadow-gaming-primary/25 hover:opacity-90 active:scale-95 transition-all group"
                        >
                            {t('ctaStart')}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
