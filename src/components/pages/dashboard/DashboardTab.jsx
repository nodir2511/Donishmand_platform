import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import { SUBJECT_CONFIG, SUBJECT_NAMES } from '../../../constants/data';
import {
    TrendingUp, Award, BookOpen, ClipboardCheck, Loader2, Filter
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

// Периоды фильтрации
const PERIODS = [
    { id: 'week', labelRu: 'Неделя', labelTj: 'Ҳафта' },
    { id: 'month', labelRu: 'Месяц', labelTj: 'Моҳ' },
    { id: 'all', labelRu: 'Всё время', labelTj: 'Ҳама вақт' },
];

const DashboardTab = () => {
    const { t, i18n } = useTranslation();
    const { profile } = useAuth();
    const lang = i18n.resolvedLanguage || 'ru';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    // Состояние графика динамики
    const [chartPeriod, setChartPeriod] = useState('all');
    const [chartSubject, setChartSubject] = useState('');
    const [dynamics, setDynamics] = useState([]);
    const [dynamicsLoading, setDynamicsLoading] = useState(false);

    // ResizeObserver для корректных размеров LineChart
    const chartContainerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(0);

    useEffect(() => {
        const el = chartContainerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            if (entries[0]?.contentRect.width > 0) {
                setChartWidth(entries[0].contentRect.width);
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [dynamics]); // Пересоздаём после загрузки данных, чтоб ref подключился

    // Загрузка сводки
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

    // Загрузка данных для графика при смене фильтров
    useEffect(() => {
        const loadDynamics = async () => {
            try {
                setDynamicsLoading(true);
                const result = await studentService.getMyTimeDynamics({
                    period: chartPeriod,
                    subjectId: chartSubject || null,
                });
                setDynamics(result);
            } catch (err) {
                console.error('Ошибка загрузки динамики:', err);
            } finally {
                setDynamicsLoading(false);
            }
        };
        loadDynamics();
    }, [chartPeriod, chartSubject]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gaming-primary animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const { subjects, summary } = data;
    const selectedSubjects = profile?.selected_subjects || [];

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

            {/* ============ ГРАФИК ДИНАМИКИ ============ */}
            <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 sm:p-6">
                {/* Заголовок + фильтры */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-base sm:text-lg font-heading font-bold text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-gaming-primary" />
                        {lang === 'ru' ? 'Динамика успеваемости' : 'Динамикаи пешрафт'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <Filter size={14} className="text-gaming-textMuted" />

                        {/* Фильтр периода */}
                        <div className="flex bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                            {PERIODS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setChartPeriod(p.id)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-all ${chartPeriod === p.id
                                        ? 'bg-gaming-primary/20 text-gaming-primary'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {lang === 'ru' ? p.labelRu : p.labelTj}
                                </button>
                            ))}
                        </div>

                        {/* Фильтр по предмету */}
                        {selectedSubjects.length > 1 && (
                            <select
                                value={chartSubject}
                                onChange={e => setChartSubject(e.target.value)}
                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-gaming-primary cursor-pointer"
                            >
                                <option value="">{lang === 'ru' ? 'Все предметы' : 'Ҳама фанҳо'}</option>
                                {selectedSubjects.map(id => (
                                    <option key={id} value={id}>
                                        {SUBJECT_NAMES[id]?.[lang] || id}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Тело графика */}
                {dynamicsLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-7 h-7 text-gaming-primary animate-spin" />
                    </div>
                ) : dynamics.length < 2 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                        <TrendingUp size={36} className="text-gaming-textMuted opacity-40" />
                        <p className="text-gaming-textMuted text-sm max-w-xs">
                            {lang === 'ru'
                                ? 'Пройдите больше тестов, чтобы увидеть динамику успеваемости'
                                : 'Барои дидани динамика тестҳои бештар гузаред'}
                        </p>
                    </div>
                ) : (
                    <div ref={chartContainerRef} className="w-full min-h-[260px] sm:min-h-[320px]">
                        {chartWidth > 0 && (
                            <LineChart
                                width={chartWidth}
                                height={chartWidth < 640 ? 260 : 320}
                                data={dynamics}
                                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#666"
                                    tick={{ fill: '#aaa', fontSize: 11 }}
                                />
                                <YAxis
                                    stroke="#666"
                                    tick={{ fill: '#aaa', fontSize: 11 }}
                                    domain={[0, 100]}
                                    width={35}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value, name) => {
                                        if (name === 'avgScore') return [`${value}%`, lang === 'ru' ? 'Средний балл' : 'Аз баҳои миёна'];
                                        if (name === 'passRate') return [`${value}%`, lang === 'ru' ? '% сдачи' : '% гузашта'];
                                        return [value, name];
                                    }}
                                    labelFormatter={label => `${lang === 'ru' ? 'Дата' : 'Сана'}: ${label}`}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 12 }}
                                    formatter={value => {
                                        if (value === 'avgScore') return lang === 'ru' ? 'Средний балл' : 'Аз баҳои миёна';
                                        if (value === 'passRate') return lang === 'ru' ? '% сдачи' : '% гузашта';
                                        return value;
                                    }}
                                />
                                {/* Средний балл — фиолетовый */}
                                <Line
                                    type="monotone"
                                    dataKey="avgScore"
                                    stroke="#6C5DD3"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#6C5DD3', r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                {/* % сдачи — голубой штрих */}
                                <Line
                                    type="monotone"
                                    dataKey="passRate"
                                    stroke="#00E0FF"
                                    strokeWidth={2}
                                    dot={{ fill: '#00E0FF', r: 2 }}
                                    strokeDasharray="5 5"
                                />
                            </LineChart>
                        )}
                    </div>
                )}
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
