import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { SUBJECT_NAMES } from '../../constants/data';
import { MOCK_SYLLABUS } from '../../constants/syllabus';
import CourseLayout from '../layout/CourseLayout';
import { getContainerStats } from '../../utils/progressHelpers';
import { syllabusService } from '../../services/syllabusService';

const SubjectPage = ({ lang, t, userRole }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    const [subjectData, setSubjectData] = useState(null);
    const [loading, setLoading] = useState(true);

    const isTeacher = userRole === 'teacher';
    const subjectName = SUBJECT_NAMES[subjectId]?.[lang] || subjectId;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Пытаемся получить данные из Supabase
                const data = await syllabusService.getStructure(subjectId);
                if (data) {
                    setSubjectData(data);
                } else {
                    // Если данных нет, используем локальный MOCK
                    console.warn(`No structure found in Supabase for ${subjectId}, using Mock data`);
                    const mock = MOCK_SYLLABUS[subjectId];
                    if (mock) {
                        setSubjectData(mock);
                    }
                }
            } catch (error) {
                console.error('Error fetching subject data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subjectId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gaming-bg">
                <Loader2 size={40} className="text-gaming-primary animate-spin" />
            </div>
        );
    }

    if (!subjectData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gaming-bg">
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

                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gaming-textMuted hover:text-white transition-all group w-fit"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">{lang === 'ru' ? 'На главную' : 'Ба асосӣ'}</span>
                    </button>
                    <p className="text-gaming-textMuted text-lg">
                        {lang === 'ru' ? 'Выберите раздел для изучения' : 'Барои омӯзиш бахшро интихоб кунед'}
                    </p>
                </div>

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
        </CourseLayout>
    );
};

export default SubjectPage;
