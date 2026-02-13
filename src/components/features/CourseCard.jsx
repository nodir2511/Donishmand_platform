import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Play } from 'lucide-react';
import { SUBJECT_CONFIG, SUBJECT_NAMES } from '../../constants/data';
import { MOCK_SYLLABUS } from '../../constants/syllabus';

const CourseCard = ({ subjectId, lang, t }) => {
    const config = SUBJECT_CONFIG[subjectId];
    const title = SUBJECT_NAMES[subjectId][lang];
    const Icon = config.icon;

    // Подсчет общего количества уроков для этого предмета
    const subjectData = MOCK_SYLLABUS[subjectId];
    const totalLessons = subjectData?.sections.reduce((acc, section) => {
        return acc + section.topics.reduce((tAcc, topic) => tAcc + topic.lessons.length, 0);
    }, 0) || 0;

    // Парсинг цвета для использования в динамических классах (при необходимости)
    // Но объекты конфигурации теперь используют классы tailwind напрямую

    return (
        <Link to={`/subject/${subjectId}`} className="block group relative bg-gaming-card rounded-3xl p-6 border border-white/5 hover:border-gaming-primary/30 shadow-lg shadow-black/20 hover:shadow-gaming-primary/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden">

            {/* Эффект свечения за карточкой */}
            <div className="absolute inset-0 bg-gradient-to-br from-gaming-primary/0 via-gaming-primary/0 to-gaming-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/5`}>
                    <Icon size={28} className={config.color} />
                </div>

                {/* Кнопка-стрелка */}
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-gaming-primary group-hover:text-white transition-all duration-300">
                    <ChevronRight size={16} />
                </div>
            </div>

            <h3 className="relative z-10 text-xl font-bold text-white mb-2 leading-tight group-hover:text-gaming-accent transition-colors">
                {title}
            </h3>

            <div className="relative z-10 flex items-center gap-3 text-sm font-medium text-gaming-textMuted mb-4">
                <span className="flex items-center gap-1">
                    <Play size={14} className="fill-gaming-primary text-gaming-primary" /> {totalLessons} {t.lessons}
                </span>
            </div>

            {/* Макет прогресс-бара */}
            <div className="relative z-10 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gaming-primary to-gaming-pink w-1/3 rounded-full"></div>
            </div>
        </Link>
    );
};

export default CourseCard;
