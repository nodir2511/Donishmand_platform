import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { MOCK_SYLLABUS } from '../../constants/syllabus';
import CourseLayout from '../layout/CourseLayout';
import { getContainerStats, getLessonStats } from '../../utils/progressHelpers';

const TopicPage = ({ lang, t, userRole }) => {
    const { subjectId, sectionId, topicId } = useParams();
    const navigate = useNavigate();

    const subjectData = MOCK_SYLLABUS[subjectId];
    const sectionData = subjectData?.sections.find(s => s.id === sectionId);
    const isTeacher = userRole === 'teacher';
    const sectionIndex = subjectData?.sections.findIndex(s => s.id === sectionId) ?? -1;
    const topicData = sectionData?.topics.find(t => t.id === topicId);
    const topicIndex = sectionData?.topics.findIndex(t => t.id === topicId) ?? -1;

    if (!topicData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white">
                <h2 className="text-2xl mb-4">{lang === 'ru' ? 'Тема не найдена' : 'Мавзӯъ ёфт нашуд'}</h2>
                <button onClick={() => navigate(`/subject/${subjectId}/section/${sectionId}`)} className="text-gaming-primary hover:underline">
                    {lang === 'ru' ? 'К разделу' : 'Ба бахш'}
                </button>
            </div>
        );
    }

    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

    return (
        <CourseLayout subjectId={subjectId} lang={lang}>
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
                        <span className="text-sm font-medium">{lang === 'ru' ? 'К разделу' : 'Ба бахш'}</span>
                    </button>
                    <p className="text-gaming-textMuted">
                        {topicData.lessons.length} {lang === 'ru' ? 'уроков' : 'дарс'}
                    </p>
                </div>

                {/* Статистика темы */}
                {(() => {
                    const stats = getContainerStats(topicData.lessons.map(l => l.id));
                    if (stats && !isTeacher) {
                        return (
                            <div className="mb-8 p-6 bg-gradient-to-r from-gaming-primary/10 to-gaming-purple/10 rounded-2xl border border-white/5 flex items-center gap-6">
                                <div className="p-4 bg-gaming-primary/20 rounded-full text-gaming-primary">
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white mb-1">{stats.avgErrorRate}%</div>
                                    <div className="text-gaming-textMuted text-sm">
                                        {lang === 'ru' ? 'Средний % ошибок по теме' : 'Миёна % хатогиҳо дар мавзӯъ'}
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
                    {topicData.lessons.map((lesson, index) => {
                        const stats = getLessonStats(lesson.id);

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
        </CourseLayout>
    );
};

export default TopicPage;
