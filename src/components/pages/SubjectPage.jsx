import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book, ArrowRight, FileText } from 'lucide-react';
import { MOCK_SYLLABUS } from '../../constants/syllabus';
import { SUBJECT_NAMES } from '../../constants/data';
import CourseLayout from '../layout/CourseLayout';
import { getContainerStats } from '../../utils/progressHelpers';

const SubjectPage = ({ lang, t }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    const subjectData = MOCK_SYLLABUS[subjectId];
    const subjectName = SUBJECT_NAMES[subjectId]?.[lang] || subjectId;

    if (!subjectData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white">
                <h2 className="text-2xl mb-4">{lang === 'ru' ? 'Предмет не найден' : 'Фан ёфт нашуд'}</h2>
                <button onClick={() => navigate('/')} className="text-gaming-primary hover:underline">
                    {lang === 'ru' ? 'На главную' : 'Ба асосӣ'}
                </button>
            </div>
        );
    }

    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

    return (
        <CourseLayout subjectId={subjectId} lang={lang}>
            <div className="max-w-5xl">
                <h1 className="text-4xl font-bold mb-2 text-white">{subjectName}</h1>
                <p className="text-gaming-textMuted text-lg mb-8">
                    {lang === 'ru' ? 'Выберите раздел для изучения' : 'Барои омӯзиш бахшро интихоб кунед'}
                </p>

                <div className="space-y-4">
                    {subjectData.sections.map((section, index) => {
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
                                        {section.topics.length} {lang === 'ru' ? 'тем' : 'мавзӯъ'} • {section.topics.reduce((acc, t) => acc + t.lessons.length, 0)} {lang === 'ru' ? 'уроков' : 'дарс'}
                                    </p>
                                </div>

                                {stats && (
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
        </CourseLayout>
    );
};

export default SubjectPage;
