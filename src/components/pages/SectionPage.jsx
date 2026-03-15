import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { CardSkeleton, Skeleton } from '../common/Skeleton';
import CourseLayout from '../layout/CourseLayout';
import { useTranslation } from 'react-i18next';
import { useSyllabus } from '../../contexts/SyllabusContext';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/apiService';

// Ключ кеша (общий с TopicPage)
const TOPIC_STATS_CACHE_KEY = 'donishmand_topic_stats';

const getCachedStats = () => {
    try {
        const cached = localStorage.getItem(TOPIC_STATS_CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

const saveCachedStats = (statsMap) => {
    try {
        const old = getCachedStats();
        localStorage.setItem(TOPIC_STATS_CACHE_KEY, JSON.stringify({ ...old, ...statsMap }));
    } catch { /* ignore */ }
};

/**
 * Получить статистику из мапы по ID
 */
const getEntityStats = (entityId, statsMap) => {
    return statsMap[entityId] || null;
};

// Внутренний компонент — имеет доступ к SyllabusContext через CourseLayout
const SectionContent = ({ subjectId, sectionId, isTeacher, navigate, lessonStats }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { subjectData, loading } = useSyllabus();

    if (loading && !subjectData) {
        return (
            <div className="max-w-5xl">
                <div className="h-10 w-2/3 bg-white/5 animate-pulse rounded-lg mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    const sectionData = subjectData?.sections.find(s => s.id === sectionId);
    const sectionIndex = subjectData?.sections.findIndex(s => s.id === sectionId) ?? -1;

    if (!sectionData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-white">
                <h2 className="text-2xl mb-4">{t('sectionNotFound')}</h2>
                <button onClick={() => navigate(`/subject/${subjectId}`)} className="text-gaming-primary hover:underline">
                    {t('backToSubject')}
                </button>
            </div>
        );
    }

    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

    // Агрегированная статистика по всему разделу
    const sectionStats = getEntityStats(sectionId, lessonStats);

    return (
        <div className="max-w-5xl">
            <h1 className="text-3xl font-bold mb-2 text-gaming-primary">
                {sectionIndex + 1}. {getTitle(sectionData)}
            </h1>

            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(`/subject/${subjectId}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gaming-textMuted hover:text-white transition-all group w-fit"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">{t('backToSubject')}</span>
                </button>
                <p className="text-gaming-textMuted">
                    {sectionData.topics.length} {t('themesCount')}
                </p>
            </div>

            {/* Статистика раздела */}
            {sectionStats && !isTeacher && (
                <div className="mb-8 p-6 bg-gradient-to-r from-gaming-accent/10 to-gaming-blue/10 rounded-2xl border border-white/5 flex items-center gap-6">
                    <div className="p-4 bg-gaming-accent/20 rounded-full text-gaming-accent">
                        <FileText size={32} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">{100 - sectionStats.avgScore}%</div>
                        <div className="text-gaming-textMuted text-sm">
                            {lang === 'ru' ? 'Средний % ошибок по разделу' : 'Миёна % хатогиҳо дар бахш'}
                        </div>
                        <div className="text-xs text-gaming-textMuted mt-1 opacity-70">
                            {lang === 'ru'
                                ? `На основе ${sectionStats.completedLessons} пройденных уроков`
                                : `Дар асоси ${sectionStats.completedLessons} дарсҳои гузашта`}
                        </div>
                    </div>
                </div>
            )}

                <div className="space-y-4">
                    {sectionData.topics.map((topic, index) => {
                        const stats = getEntityStats(topic.id, lessonStats);

                        return (
                            <Link
                                key={topic.id}
                                to={`/subject/${subjectId}/section/${sectionId}/topic/${topic.id}`}
                                className="group flex items-center gap-4 bg-gaming-card/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl hover:border-gaming-accent/50 transition-all duration-300 hover:bg-gaming-card/60"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gaming-accent/10 flex items-center justify-center text-gaming-accent group-hover:scale-110 transition-transform">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold group-hover:text-gaming-accent transition-colors truncate">
                                        {sectionIndex + 1}.{index + 1}. {getTitle(topic)}
                                    </h3>
                                    <p className="text-sm text-gaming-textMuted">
                                        {topic.lessons.length} {t('lessonsCount')}
                                    </p>
                                </div>

                                {stats ? (
                                    stats.avgScore !== null && !isTeacher && (
                                        <div className="mr-2 text-right">
                                            <div className="text-xl font-bold text-white leading-none">{100 - stats.avgScore}%</div>
                                            <div className="text-[10px] text-gaming-textMuted uppercase tracking-wider opacity-70">
                                                {lang === 'ru' ? 'ошибок' : 'хато'}
                                            </div>
                                        </div>
                                    )
                                ) : (!isTeacher && (
                                    <Skeleton className="w-16 h-10 rounded-lg mr-2" />
                                ))}

                                <ArrowRight className="text-white/20 group-hover:text-gaming-accent transition-colors shrink-0" />
                            </Link>
                        );
                    })}
                </div>
        </div>
    );
};

const SectionPage = () => {
    const { subjectId, sectionId } = useParams();
    const navigate = useNavigate();
    const { isTeacher: rawIsTeacher, isAdmin, profile } = useAuth();
    const isTeacher = rawIsTeacher || isAdmin;

    // SWR: мгновенно показать кеш, затем обновить с сервера
    const [lessonStats, setLessonStats] = useState(() => getCachedStats());

    useEffect(() => {
        if (isTeacher || !profile) return;

        let cancelled = false;

        const fetchStats = async () => {
            try {
                const data = await studentService.getDashboardStats([subjectId]);
                if (cancelled || !data) return;

                const lessonsStats = data.lessonStats || {};
                const hierarchyStats = data.statsMap || {};
                const fullStatsMap = { ...lessonsStats, ...hierarchyStats };

                if (!cancelled) {
                    setLessonStats(fullStatsMap);
                    saveCachedStats(fullStatsMap);
                }
            } catch (err) {
                console.error('Ошибка загрузки статистики раздела через RPC:', err);
            }
        };

        fetchStats();
        return () => { cancelled = true; };
    }, [profile, isTeacher]);

    return (
        <CourseLayout subjectId={subjectId}>
            <SectionContent
                subjectId={subjectId}
                sectionId={sectionId}
                isTeacher={isTeacher}
                navigate={navigate}
                lessonStats={lessonStats}
            />
        </CourseLayout>
    );
};

export default SectionPage;
