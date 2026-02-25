import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import CourseLayout from '../layout/CourseLayout';
import { useTranslation } from 'react-i18next';
import { useSyllabus } from '../../contexts/SyllabusContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

// Ключ кеша статистики по темам
const TOPIC_STATS_CACHE_KEY = 'donishmand_topic_stats';

/**
 * Загрузить кеш статистики из localStorage.
 * @returns {Object} { lessonId: { totalAttempts, bestScore, avgErrorRate, avgScore, lastAttemptAt } }
 */
const getCachedStats = () => {
    try {
        const cached = localStorage.getItem(TOPIC_STATS_CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

/**
 * Сохранить статистику в localStorage-кеш.
 */
const saveCachedStats = (statsMap) => {
    try {
        // Мерж со старыми данными, чтобы не затирать другие предметы
        const old = getCachedStats();
        const merged = { ...old, ...statsMap };
        localStorage.setItem(TOPIC_STATS_CACHE_KEY, JSON.stringify(merged));
    } catch { /* ignore */ }
};

/**
 * Рассчитать статистику по урокам из массива результатов тестов.
 * @param {Array} testResults - массив записей из user_test_results
 * @returns {Object} lessonsStats — { lessonId: { totalAttempts, bestScore, avgErrorRate, avgScore, lastAttemptAt } }
 */
const computeStatsFromResults = (testResults) => {
    const byLesson = {};
    for (const r of testResults) {
        if (!byLesson[r.lesson_id]) byLesson[r.lesson_id] = [];
        byLesson[r.lesson_id].push(r);
    }

    const stats = {};
    for (const [lessonId, results] of Object.entries(byLesson)) {
        const totalAttempts = results.length;
        const bestScore = Math.max(...results.map(r => r.score));
        const avgScore = results.reduce((acc, r) => acc + r.score, 0) / totalAttempts;
        const avgErrorRate = Math.round(100 - avgScore);
        const lastAttemptAt = Math.max(...results.map(r => new Date(r.created_at).getTime()));

        stats[lessonId] = { totalAttempts, bestScore, avgErrorRate, avgScore, lastAttemptAt };
    }
    return stats;
};

// Внутренний компонент — имеет доступ к SyllabusContext через CourseLayout
const TopicContent = ({ subjectId, sectionId, topicId, isTeacher, navigate, lessonStats }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { subjectData, loading } = useSyllabus();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 size={40} className="text-gaming-primary animate-spin" />
            </div>
        );
    }

    const sectionData = subjectData?.sections.find(s => s.id === sectionId);
    const sectionIndex = subjectData?.sections.findIndex(s => s.id === sectionId) ?? -1;
    const topicData = sectionData?.topics.find(t => t.id === topicId);
    const topicIndex = sectionData?.topics.findIndex(t => t.id === topicId) ?? -1;

    if (!topicData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-white">
                <h2 className="text-2xl mb-4">{t('topicNotFound')}</h2>
                <button onClick={() => navigate(`/subject/${subjectId}/section/${sectionId}`)} className="text-gaming-primary hover:underline">
                    {t('backToSection')}
                </button>
            </div>
        );
    }

    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

    // Считаем агрегированную статистику по теме из серверных данных
    const topicStats = (() => {
        const lessonIds = topicData.lessons.map(l => l.id);
        let completedCount = 0;
        let totalAvgScore = 0;

        for (const lid of lessonIds) {
            const s = lessonStats[lid];
            if (s) {
                completedCount++;
                totalAvgScore += s.avgScore;
            }
        }

        if (completedCount === 0) return null;

        return {
            completedLessons: completedCount,
            totalLessons: lessonIds.length,
            avgErrorRate: Math.round(100 - (totalAvgScore / completedCount)),
        };
    })();

    return (
        <div className="max-w-5xl">
            <h1 className="text-3xl font-bold mb-2 text-gaming-accent">
                {sectionIndex + 1}.{topicIndex + 1}. {getTitle(topicData)}
            </h1>

            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(`/subject/${subjectId}/section/${sectionId}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gaming-textMuted hover:text-white transition-all group w-fit"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">{t('backToSection')}</span>
                </button>
                <p className="text-gaming-textMuted">
                    {topicData.lessons.length} {t('lessonsCount')}
                </p>
            </div>

            {/* Статистика темы */}
            {topicStats && !isTeacher && (
                <div className="mb-8 p-6 bg-gradient-to-r from-gaming-primary/10 to-gaming-purple/10 rounded-2xl border border-white/5 flex items-center gap-6">
                    <div className="p-4 bg-gaming-primary/20 rounded-full text-gaming-primary">
                        <FileText size={32} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">{topicStats.avgErrorRate}%</div>
                        <div className="text-gaming-textMuted text-sm">
                            {lang === 'ru' ? 'Средний % ошибок по теме' : 'Миёна % хатогиҳо дар мавзӯъ'}
                        </div>
                        <div className="text-xs text-gaming-textMuted mt-1 opacity-70">
                            {lang === 'ru'
                                ? `На основе ${topicStats.completedLessons} пройденных уроков`
                                : `Дар асоси ${topicStats.completedLessons} дарсҳои гузашта`}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {topicData.lessons.map((lesson, index) => {
                    const stats = lessonStats[lesson.id] || null;

                    return (
                        <Link
                            key={lesson.id}
                            to={`/lesson/${lesson.id}`}
                            className="group flex items-center gap-4 bg-gaming-card/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl hover:border-gaming-pink/50 transition-all duration-300 hover:bg-gaming-card/60"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gaming-pink/10 flex items-center justify-center text-gaming-pink group-hover:scale-110 transition-transform">
                                {lesson.type === 'video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold group-hover:text-gaming-pink transition-colors truncate">
                                    {index + 1}. {getTitle(lesson)}
                                </h3>
                                <span className="uppercase text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gaming-textMuted tracking-wider">
                                    {lesson.type === 'video' ? (lang === 'ru' ? 'видео' : 'видео') : (lang === 'ru' ? 'текст' : 'матн')}
                                </span>
                            </div>

                            {stats && !isTeacher && (
                                <div className="mr-2 text-right">
                                    <div className="text-xl font-bold text-white leading-none">{stats.avgErrorRate}%</div>
                                    <div className="text-[10px] text-gaming-textMuted uppercase tracking-wider opacity-70">
                                        {lang === 'ru' ? 'ошибок' : 'хато'}
                                    </div>
                                </div>
                            )}

                            <ArrowRight className="text-white/20 group-hover:text-gaming-pink transition-colors shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const TopicPage = () => {
    const { subjectId, sectionId, topicId } = useParams();
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
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser?.id || cancelled) return;

                const { data: testResults, error } = await supabase
                    .from('user_test_results')
                    .select('lesson_id, score, correct_count, total_questions, is_passed, created_at')
                    .eq('user_id', authUser.id);

                if (error || !testResults || cancelled) return;

                const computed = computeStatsFromResults(testResults);

                if (!cancelled) {
                    setLessonStats(computed);
                    saveCachedStats(computed);
                }
            } catch (err) {
                console.error('Ошибка загрузки статистики темы:', err);
            }
        };

        fetchStats();
        return () => { cancelled = true; };
    }, [profile, isTeacher]);

    return (
        <CourseLayout subjectId={subjectId}>
            <TopicContent
                subjectId={subjectId}
                sectionId={sectionId}
                topicId={topicId}
                isTeacher={isTeacher}
                navigate={navigate}
                lessonStats={lessonStats}
            />
        </CourseLayout>
    );
};

export default TopicPage;

