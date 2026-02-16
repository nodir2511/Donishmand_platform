import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { SUBJECT_NAMES } from '../../constants/data';
import CourseLayout from '../layout/CourseLayout';
import { getContainerStats } from '../../utils/progressHelpers';
import { useTranslation } from 'react-i18next';
import { useSyllabus } from '../../contexts/SyllabusContext';

// Внутренний компонент — имеет доступ к SyllabusContext через CourseLayout
const SubjectContent = ({ subjectId, subjectName, isTeacher, navigate }) => {
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
                    // Рассчитываем статистику для раздела
                    const allLessonIds = section.topics.flatMap(t => t.lessons.map(l => l.id));
                    const stats = getContainerStats(allLessonIds);

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

                            {stats && !isTeacher && (
                                <div className="mr-2 text-right">
                                    <div className="text-xl font-bold text-white leading-none">{stats.avgErrorRate}%</div>
                                    <div className="text-[10px] text-gaming-textMuted uppercase tracking-wider opacity-70">
                                        {lang === 'ru' ? 'ошибок' : 'хато'}
                                    </div>
                                </div>
                            )}

                            <ArrowRight className="text-white/20 group-hover:text-gaming-primary transition-colors shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

import { useAuth } from '../../contexts/AuthContext';

// ...

const SubjectPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { isTeacher } = useAuth(); // Используем хук вместо пропса
    const subjectName = SUBJECT_NAMES[subjectId]?.[lang] || subjectId;

    return (
        <CourseLayout subjectId={subjectId}>
            <SubjectContent
                subjectId={subjectId}
                subjectName={subjectName}
                isTeacher={isTeacher}
                navigate={navigate}
            />
        </CourseLayout>
    );
};

export default SubjectPage;
