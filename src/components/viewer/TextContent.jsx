import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { renderKatex } from '../../utils/katexRenderer';

// Компонент отображения текстового контента урока
const TextContent = ({ bodyText, isTextRead, isTeacher, onTextRead }) => {
    const { t } = useTranslation();

    return (
        <div
            className="prose prose-invert max-w-none prose-p:text-gaming-textMuted prose-headings:text-white prose-li:text-gaming-textMuted"
            onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollTop + clientHeight >= scrollHeight - 50) onTextRead();
            }}
        >
            <div
                dangerouslySetInnerHTML={{ __html: renderKatex(bodyText) }}
            />
            {!isTextRead && !isTeacher && (
                <button
                    onClick={onTextRead}
                    className="mt-4 flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                >
                    <Eye size={16} />
                    {t('lesson.markAsRead')}
                </button>
            )}
        </div>
    );
};

export default React.memo(TextContent);
