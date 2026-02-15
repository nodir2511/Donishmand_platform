import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import CourseLayout from '../layout/CourseLayout';
import { getContainerStats } from '../../utils/progressHelpers';
import { useSyllabus } from '../../contexts/SyllabusContext';

// Внутренний компонент — имеет доступ к SyllabusContext через CourseLayout
const SectionContent = ({ lang, t, subjectId, sectionId, isTeacher, navigate }) => {
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

    if (!sectionData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-white">
                <h2 className="text-2xl mb-4">{t.sectionNotFound}</h2>
                <button onClick={() => navigate(`/subject/${subjectId}`)} className="text-gaming-primary hover:underline">
                    {t.backToSubject}
                </button>
            </div>
        );
    }

    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

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
                    <span className="text-sm font-medium">{t.backToSubject}</span>
                </button>
                <p className="text-gaming-textMuted">
                    {sectionData.topics.length} {t.themesCount}
                </p>
            </div>

            {/* Статистика раздела */}
            {(() => {
                // Собираем все ID уроков из всех тем раздела
                const allLessonIds = sectionData.topics.flatMap(topic => topic.lessons.map(l => l.id));
                const stats = getContainerStats(allLessonIds);

                if (stats && !isTeacher) {
                    return (
                        <div className="mb-8 p-6 bg-gradient-to-r from-gaming-accent/10 to-gaming-blue/10 rounded-2xl border border-white/5 flex items-center gap-6">
                            <div className="p-4 bg-gaming-accent/20 rounded-full text-gaming-accent">
                                <FileText size={32} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">{stats.avgErrorRate}%</div>
                                <div className="text-gaming-textMuted text-sm">
                                    {lang === 'ru' ? 'Средний % ошибок по разделу' : 'Миёна % хатогиҳо дар бахш'}
                                </div>
                                <div className="text-xs text-gaming-textMuted mt-1 opacity-70">
                                    {lang === 'ru'
                                        ? `На основе ${stats.completedLessons} пройденных уроков`
                                        : `Дар асоси ${stats.completedLessons} дарсҳои гузашта`}
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            <div className="space-y-4">
                {sectionData.topics.map((topic, index) => {
                    // Рассчитываем статистику для темы
                    const lessonIds = topic.lessons.map(l => l.id);
                    const stats = getContainerStats(lessonIds);

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
                                    {topic.lessons.length} {t.lessonsCount}
                                </p>
                            </div>

                            {stats && !isTeacher && (
                                <div className="mr-2 text-right">
                                    <div className="text-xl font-bold text-white leading-none">{stats.avgErrorRate}%</div>
                                    <div className="text-[10px] text-gaming-textMuted uppercase tracking-wider opacity-70">
                                        {lang === 'ru' ? 'ошибок' : 'хато'}
                                    </div>
                                </div>
                            )}

                            <ArrowRight className="text-white/20 group-hover:text-gaming-accent transition-colors shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const SectionPage = ({ lang, t, userRole }) => {
    const { subjectId, sectionId } = useParams();
    const navigate = useNavigate();
    const isTeacher = userRole === 'teacher';

    return (
        <CourseLayout subjectId={subjectId} lang={lang}>
            <SectionContent
                lang={lang}
                t={t}
                subjectId={subjectId}
                sectionId={sectionId}
                isTeacher={isTeacher}
                navigate={navigate}
            />
        </CourseLayout>
    );
};

export default SectionPage;
