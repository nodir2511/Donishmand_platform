import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SUBJECT_CONFIG, SUBJECT_NAMES } from '../../constants/data';
import { useTranslation } from 'react-i18next';

const CourseCard = ({ subjectId, progress = 0 }) => {
    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const config = SUBJECT_CONFIG[subjectId];
    const title = SUBJECT_NAMES[subjectId][lang];
    const Icon = config.icon;

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

            <h3 className="relative z-10 text-xl font-bold text-white mb-4 leading-tight group-hover:text-gaming-accent transition-colors">
                {title}
            </h3>

            {/* Прогресс-бар */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gaming-textMuted">
                        {progress > 0 ? 'Прогресс' : ''}
                    </span>
                    {progress > 0 && (
                        <span className="text-xs font-bold text-gaming-primary">
                            {progress}%
                        </span>
                    )}
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-gaming-primary to-gaming-pink rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </Link>
    );
};

export default CourseCard;
