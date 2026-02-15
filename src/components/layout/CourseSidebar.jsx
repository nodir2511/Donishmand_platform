import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Book, FileText, PlayCircle, Home, Loader2 } from 'lucide-react';
import { SUBJECT_NAMES } from '../../constants/data';
import { useSyllabus } from '../../contexts/SyllabusContext';

const CourseSidebar = ({ subjectId, lang }) => {
    const location = useLocation();
    const { subjectData, loading } = useSyllabus();
    const subjectName = SUBJECT_NAMES[subjectId]?.[lang] || subjectId;

    // Извлечение текущих ID из URL
    const pathParts = location.pathname.split('/');
    const currentSectionId = pathParts[pathParts.indexOf('section') + 1];
    const currentTopicId = pathParts[pathParts.indexOf('topic') + 1];
    const currentLessonId = pathParts[pathParts.indexOf('lesson') + 1];

    // Состояние раскрытых разделов и тем
    const [expandedSections, setExpandedSections] = useState(() => {
        // Раскрыть текущий раздел по умолчанию
        if (currentSectionId) return { [currentSectionId]: true };
        return {};
    });
    const [expandedTopics, setExpandedTopics] = useState(() => {
        // Раскрыть текущую тему по умолчанию
        if (currentTopicId) return { [currentTopicId]: true };
        return {};
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const toggleTopic = (topicId, e) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
    };

    // Показываем спиннер загрузки, пока данные грузятся
    if (loading) {
        return (
            <aside className="w-72 lg:w-80 h-full bg-gaming-card/50 backdrop-blur-xl border-r border-white/5 flex items-center justify-center">
                <Loader2 size={24} className="text-gaming-primary animate-spin" />
            </aside>
        );
    }

    if (!subjectData) return null;

    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

    return (
        <aside className="w-72 lg:w-80 h-full bg-gaming-card/50 backdrop-blur-xl border-r border-white/5 flex flex-col overflow-hidden">
            {/* Шапка */}
            <div className="p-4 border-b border-white/5">
                <Link to="/" className="flex items-center gap-2 text-gaming-textMuted hover:text-white text-sm mb-3 transition-colors">
                    <Home size={14} />
                    <span>{lang === 'ru' ? 'Главная' : 'Асосӣ'}</span>
                </Link>
                <Link to={`/subject/${subjectId}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gaming-primary/10 flex items-center justify-center text-gaming-primary">
                        <Book size={20} />
                    </div>
                    <span className="font-bold text-lg text-white truncate">{subjectName}</span>
                </Link>
            </div>

            {/* Дерево навигации */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {subjectData.sections.map((section, sectionIdx) => {
                    const isSectionActive = currentSectionId === section.id;
                    const isSectionExpanded = expandedSections[section.id] || isSectionActive;

                    return (
                        <div key={section.id} className="mb-1">
                            {/* Раздел */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all group ${isSectionActive ? 'bg-gaming-primary/20 text-white' : 'hover:bg-white/5 text-gaming-textMuted hover:text-white'}`}
                            >
                                <span className={`transition-transform ${isSectionExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} />
                                </span>
                                <span className="font-semibold text-sm truncate">
                                    {sectionIdx + 1}. {getTitle(section)}
                                </span>
                            </button>

                            {/* Темы */}
                            {isSectionExpanded && (
                                <div className="ml-4 mt-1 space-y-0.5 border-l border-white/5 pl-3">
                                    {section.topics.map((topic, topicIdx) => {
                                        const isTopicActive = currentTopicId === topic.id;
                                        const isTopicExpanded = expandedTopics[topic.id] || isTopicActive || currentLessonId;

                                        return (
                                            <div key={topic.id}>
                                                {/* Тема */}
                                                <Link
                                                    to={`/subject/${subjectId}/section/${section.id}/topic/${topic.id}`}
                                                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all group ${isTopicActive && !currentLessonId ? 'bg-gaming-accent/20 text-gaming-accent' : 'hover:bg-white/5 text-gaming-textMuted hover:text-white'}`}
                                                >
                                                    <button onClick={(e) => toggleTopic(topic.id, e)} className={`transition-transform ${isTopicExpanded ? 'rotate-90' : ''}`}>
                                                        <ChevronRight size={14} />
                                                    </button>
                                                    <FileText size={14} className="opacity-50 shrink-0" />
                                                    <span className="truncate">{sectionIdx + 1}.{topicIdx + 1}. {getTitle(topic)}</span>
                                                </Link>

                                                {/* Уроки */}
                                                {isTopicExpanded && (
                                                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-white/5 pl-2">
                                                        {topic.lessons.map((lesson, lessonIdx) => {
                                                            const isLessonActive = currentLessonId === lesson.id;
                                                            return (
                                                                <Link
                                                                    key={lesson.id}
                                                                    to={`/lesson/${lesson.id}`}
                                                                    className={`flex items-center gap-2 p-1.5 rounded-lg text-xs transition-all ${isLessonActive ? 'bg-gaming-pink/20 text-gaming-pink font-semibold' : 'text-gaming-textMuted hover:text-white hover:bg-white/5'}`}
                                                                >
                                                                    {lesson.type === 'video' ? <PlayCircle size={12} /> : <FileText size={12} />}
                                                                    <span className="truncate">{lessonIdx + 1}. {getTitle(lesson)}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default CourseSidebar;
