import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../../services/studentService';
import { SUBJECT_NAMES } from '../../../constants/data';
import { useAuth } from '../../../contexts/AuthContext';
import {
    Loader2, CheckCircle, XCircle, RotateCcw, Filter,
    ChevronDown, ChevronUp, Calendar, ClipboardList
} from 'lucide-react';

const TestHistoryTab = () => {
    const { t, i18n } = useTranslation();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const lang = i18n.resolvedLanguage || 'ru';

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [period, setPeriod] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await studentService.getMyTestHistory({
                    period,
                    subjectId: subjectFilter,
                });
                setResults(data);
            } catch (err) {
                console.error('Ошибка загрузки истории тестов:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [period, subjectFilter]);

    // Форматирование даты
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'tg-TJ', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Цвет по баллу
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-500/10 border-green-500/20';
        if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    // Переход к тесту для повторного прохождения
    const handleRetakeTest = (lessonId) => {
        navigate(`/lesson/${lessonId}`);
    };

    const periods = [
        { id: 'week', label: t('studentDashboard.periodWeek') },
        { id: 'month', label: t('studentDashboard.periodMonth') },
        { id: 'all', label: t('studentDashboard.periodAll') },
    ];

    const selectedSubjects = profile?.selected_subjects || [];

    return (
        <div className="space-y-6">
            {/* Фильтры */}
            <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-sm font-medium text-gaming-textMuted hover:text-white transition-colors w-full"
                >
                    <Filter size={16} />
                    {t('studentDashboard.filters')}
                    {showFilters ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
                </button>

                {showFilters && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        {/* Фильтр по периоду */}
                        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                            {periods.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${period === p.id
                                        ? 'bg-gaming-primary text-white'
                                        : 'text-gaming-textMuted hover:text-white'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Фильтр по предмету */}
                        {selectedSubjects.length > 1 && (
                            <select
                                value={subjectFilter || ''}
                                onChange={(e) => setSubjectFilter(e.target.value || null)}
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gaming-primary cursor-pointer"
                            >
                                <option value="">{t('studentDashboard.allSubjects')}</option>
                                {selectedSubjects.map(id => (
                                    <option key={id} value={id}>
                                        {SUBJECT_NAMES[id]?.[lang] || id}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
            </div>

            {/* Список попыток */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-gaming-primary animate-spin" />
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-3">
                    {results.map((result) => (
                        <div
                            key={result.id}
                            className={`bg-gaming-card/60 backdrop-blur-xl border rounded-2xl p-5 transition-all hover:border-white/10 ${getScoreBg(result.score)}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Статус */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {result.is_passed ? (
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle size={20} className="text-green-400" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                            <XCircle size={20} className="text-red-400" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate">
                                            {result.lessonName}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gaming-textMuted mt-1">
                                            <Calendar size={12} />
                                            {formatDate(result.created_at)}
                                        </div>
                                    </div>
                                </div>

                                {/* Результаты */}
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className={`text-xl font-bold ${getScoreColor(result.score)}`}>
                                            {result.score}%
                                        </div>
                                        <div className="text-[10px] text-gaming-textMuted uppercase">
                                            {t('studentDashboard.score')}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-sm font-medium text-white">
                                            {result.correct_count}/{result.total_questions}
                                        </div>
                                        <div className="text-[10px] text-gaming-textMuted uppercase">
                                            {t('studentDashboard.correct')}
                                        </div>
                                    </div>

                                    {/* Кнопка «Работа над ошибками» — только для проваленных */}
                                    {!result.is_passed && (
                                        <button
                                            onClick={() => handleRetakeTest(result.lesson_id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gaming-primary/10 text-gaming-primary border border-gaming-primary/20 rounded-xl text-xs font-medium hover:bg-gaming-primary hover:text-white transition-all active:scale-95 whitespace-nowrap"
                                        >
                                            <RotateCcw size={14} />
                                            {t('studentDashboard.retakeTest')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
                    <ClipboardList size={40} className="mx-auto mb-3 text-gaming-textMuted" />
                    <p className="text-gaming-textMuted">{t('studentDashboard.noTestHistory')}</p>
                </div>
            )}
        </div>
    );
};

export default TestHistoryTab;
