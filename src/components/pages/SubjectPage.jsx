import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book, ArrowRight, ArrowLeft } from 'lucide-react';
import { CardSkeleton } from '../common/Skeleton';
import { SUBJECT_NAMES } from '../../constants/data';
import CourseLayout from '../layout/CourseLayout';
import { useTranslation } from 'react-i18next';
import { useSyllabus } from '../../contexts/SyllabusContext';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/apiService';

// Ключ кеша (общий с TopicPage и SectionPage)
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
 * Получить статистику из мапы по ID (урок/тема/раздел)
 */
const getEntityStats = (entityId, statsMap) => {
    return statsMap[entityId] || null;
};

// Внутренний компонент — имеет доступ к SyllabusContext через CourseLayout
const SubjectContent = ({ subjectId, subjectName, isTeacher, navigate, lessonStats }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { subjectData, loading } = useSyllabus();

    if (loading && !subjectData) {
        return (
            <div className="max-w-5xl">
                <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (!subjectData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-white">
                <h2 className="text-2xl mb-4">{t('subjectNotFound')}</h2>
                <button onClick={() => navigate('/')} className="text-gaming-primary hover:underline">
                    {t('backToMain')}
                </button>
            </div>
        );
    }

    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

    return (
        <div className="max-w-5xl">
            <h1 className="text-4xl font-bold mb-2 text-white">{subjectName}</h1>

            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gaming-textMuted hover:text-white transition-all group w-fit"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">{t('backToMain')}</span>
                </button>
                <p className="text-gaming-textMuted text-lg">
                    {t('selectSection')}
                </p>
            </div>

            <div className="space-y-4">
                {subjectData.sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gaming-primary/10 flex items-center justify-center mb-4">
                            <Book size={36} className="text-gaming-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {t('contentDeveloping')}
                        </h3>
                        <p className="text-gaming-textMuted max-w-md">
                            {t('contentComingSoon')}
                        </p>
                    </div>
                ) : subjectData.sections.map((section, index) => {
                    const stats = getEntityStats(section.id, lessonStats);

                    return (
                        <Link
                            key={section.id}
                            to={`/subject/${subjectId}/section/${section.id}`}
                            className="group flex items-center gap-4 bg-gaming-card/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl hover:border-gaming-primary/50 transition-all duration-300 hover:bg-gaming-card/60"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gaming-primary/10 flex items-center justify-center text-gaming-primary group-hover:scale-110 transition-transform">
                                <Book size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold group-hover:text-gaming-primary transition-colors truncate">
                                    {index + 1}. {getTitle(section)}
                                </h3>
                                <p className="text-sm text-gaming-textMuted">
                                    {section.topics.length} {t('themesCount')} • {section.topics.reduce((acc, t) => acc + t.lessons.length, 0)} {t('lessonsCount')}
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
                            ) : (!isTeacher && !statsLoaded && (
                                <Skeleton className="w-16 h-10 rounded-lg mr-2" />
                            ))}

                            <ArrowRight className="text-white/20 group-hover:text-gaming-primary transition-colors shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const SubjectPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { isTeacher: rawIsTeacher, isAdmin, profile } = useAuth();
    const isTeacher = rawIsTeacher || isAdmin;
    const subjectName = SUBJECT_NAMES[subjectId]?.[lang] || subjectId;

    // SWR: мгновенно показать кеш, затем обновить с сервера
    const [lessonStats, setLessonStats] = useState(() => getCachedStats());
    const [statsLoaded, setStatsLoaded] = useState(false);

    useEffect(() => {
        if (isTeacher || !profile) {
            setStatsLoaded(true);
            return;
        }

        let cancelled = false;

        const fetchStats = async () => {
            try {
                // Вызываем серверную агрегацию для текущего предмета
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
                console.error('Ошибка загрузки статистики предмета через RPC:', err);
            } finally {
                if (!cancelled) setStatsLoaded(true);
            }
        };

        fetchStats();
        return () => { cancelled = true; };
    }, [profile, isTeacher]);

    return (
        <CourseLayout subjectId={subjectId}>
            <SubjectContent
                subjectId={subjectId}
                subjectName={subjectName}
                isTeacher={isTeacher}
                navigate={navigate}
                lessonStats={lessonStats}
            />
        </CourseLayout>
    );
};

export default SubjectPage;
