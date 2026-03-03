import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import { SUBJECT_CONFIG, SUBJECT_NAMES } from '../../../constants/data';
import {
    TrendingUp, Award, BookOpen, ClipboardCheck, Loader2
} from 'lucide-react';

const DashboardTab = () => {
    const { t, i18n } = useTranslation();
    const { profile } = useAuth();
    const lang = i18n.resolvedLanguage || 'ru';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const subjects = profile?.selected_subjects || [];
                const result = await studentService.getMyProgressSummary(subjects);
                setData(result);
            } catch (err) {
                console.error('Ошибка загрузки дашборда:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [profile]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gaming-primary animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const { subjects, summary } = data;

    // Мини-карточки со сводкой
    const summaryCards = [
        {
            icon: ClipboardCheck,
            label: t('studentDashboard.totalTests'),
            value: summary.totalTests,
            color: 'text-gaming-primary',
            bg: 'bg-gaming-primary/10',
        },
        {
            icon: TrendingUp,
            label: t('studentDashboard.avgScore'),
            value: `${summary.avgScore}%`,
            color: 'text-gaming-accent',
            bg: 'bg-gaming-accent/10',
        },
        {
            icon: Award,
            label: t('studentDashboard.bestScore'),
            value: `${summary.bestScore}%`,
            color: 'text-gaming-gold',
            bg: 'bg-gaming-gold/10',
        },
        {
            icon: BookOpen,
            label: t('studentDashboard.lessonsCompleted'),
            value: `${summary.completedLessons}/${summary.totalLessons}`,
            color: 'text-gaming-pink',
            bg: 'bg-gaming-pink/10',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Общая сводка */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                        >
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                                <Icon size={20} className={card.color} />
                            </div>
                            <div className="text-2xl font-heading font-bold text-white">{card.value}</div>
                            <div className="text-xs text-gaming-textMuted mt-1">{card.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Прогресс по предметам */}
            <div>
                <h2 className="text-lg font-heading font-bold text-white mb-4">
                    {t('studentDashboard.progressBySubject')}
                </h2>

                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map(subj => {
                            const config = SUBJECT_CONFIG[subj.subjectId];
                            const name = SUBJECT_NAMES[subj.subjectId]?.[lang] || subj.subjectId;
                            const Icon = config?.icon || BookOpen;

                            return (
                                <div
                                    key={subj.subjectId}
                                    className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${config?.bg || 'bg-white/10'} flex items-center justify-center`}>
                                            <Icon size={20} className={config?.color || 'text-white'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate">{name}</div>
                                            <div className="text-xs text-gaming-textMuted">
                                                {subj.completedLessons} / {subj.totalLessons} {t('studentDashboard.lessons')}
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-gaming-primary">
                                            {subj.progress}%
                                        </div>
                                    </div>

                                    {/* Прогресс-бар */}
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-gaming-primary to-gaming-accent rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${subj.progress}%` }}
                                        />
                                    </div>

                                    {/* Средний балл */}
                                    {subj.avgScore !== null && (
                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <span className="text-gaming-textMuted">{t('studentDashboard.avgTestScore')}</span>
                                            <span className={`font-bold ${subj.avgScore >= 80 ? 'text-green-400' :
                                                    subj.avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                                                }`}>
                                                {subj.avgScore}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                        <BookOpen size={40} className="mx-auto mb-3 text-gaming-textMuted" />
                        <p className="text-gaming-textMuted">{t('studentDashboard.noSubjects')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardTab;
