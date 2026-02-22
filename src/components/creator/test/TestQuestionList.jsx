import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit3, Trash2, List, ArrowLeftRight, Hash, Image as ImageIcon } from 'lucide-react';

const QUESTION_ICONS = {
    multiple_choice: List,
    matching: ArrowLeftRight,
    numeric: Hash,
};

const SortableQuestionItem = ({ question, index, onEdit, onDelete, lang }) => {
    const { t, i18n } = useTranslation();
    const currentLang = lang || i18n.resolvedLanguage || 'ru';

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const Icon = QUESTION_ICONS[question.type] || List;

    // Улучшенное определение текста вопроса с поддержкой устаревших данных
    // Мы ИСКЛЮЧАЕМ устаревшие поля, если они содержат только числа (старые ID/последовательности/ответы вроде 25, 1234)
    const getQuestionText = () => {
        const stripHtmlTags = (val) => val ? val.toString().replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';
        const isNumeric = (val) => { const s = stripHtmlTags(val); return s !== '' && /^\d+$/.test(s); };

        // Новые поля (textRu, textTj) - выводим как есть (не фильтруя через isNumeric, так как там может быть любой текст)
        const primaryText = currentLang === 'tj' ? question.textTj : question.textRu;
        const secondaryText = currentLang === 'tj' ? question.textRu : question.textTj;

        if (primaryText && stripHtmlTags(primaryText).length > 0) return primaryText;
        if (secondaryText && stripHtmlTags(secondaryText).length > 0) return secondaryText;

        // Для устаревших полей применяем фильтрацию isNumeric
        const legacyVariants = [
            question.question,
            question.text,
            question.title
        ];

        for (const v of legacyVariants) {
            if (v && !isNumeric(v)) return v;
        }

        return '';
    };

    const questionText = getQuestionText();

    // Безопасное удаление HTML-тегов с использованием DOMParser или регулярных выражений
    const stripHtml = (html) => {
        if (!html) return '';
        // Заменяем блочные теги пробелом для предотвращения слипания слов
        let text = html.replace(/<\/(p|div|h\d|li|br)>/g, ' ');
        // Регулярное выражение для удаления тегов
        text = text.replace(/<[^>]*>?/gm, '');
        // Декодируем общие сущности и обрезаем пробелы
        return text.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    };

    const summaryText = stripHtml(questionText);
    const summary = summaryText || t('creator.noQuestionText');
    const hasImage = currentLang === 'tj'
        ? (question.imageTj || question.imageRu || question.image)
        : (question.imageRu || question.imageTj || question.image);

    return (
        <div ref={setNodeRef} style={style} className="bg-gaming-card/40 rounded-xl border border-white/5 p-3 flex items-center gap-3 group hover:border-white/10 transition-colors">
            <div {...attributes} {...listeners} className="cursor-grab text-gaming-textMuted hover:text-white shrink-0 p-1">
                <GripVertical size={20} />
            </div>

            <div className="w-10 h-10 rounded-lg bg-gaming-bg/50 flex items-center justify-center shrink-0 text-gaming-primary border border-white/5">
                <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0 cursor-pointer py-1" onClick={() => onEdit(question)}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gaming-textMuted">#{index + 1}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-gaming-textMuted/70 border border-white/5">
                        {t(`creator.${question.type === 'multiple_choice' ? 'singleChoice' : question.type}`)}
                    </span>
                    {hasImage && <ImageIcon size={14} className="text-gaming-accent" />}
                </div>
                <p className="text-sm text-white group-hover:text-gaming-primary transition-colors line-clamp-2 leading-relaxed font-medium">
                    {summary}
                </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                    onClick={() => onEdit(question)}
                    className="p-2 text-gaming-textMuted hover:text-gaming-accent transition-colors rounded-lg hover:bg-white/5"
                    title={t('creator.edit')}
                >
                    <Edit3 size={18} />
                </button>
                <button
                    onClick={() => onDelete(question.id)}
                    className="p-2 text-gaming-textMuted hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                    title={t('creator.delete')}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

const TestQuestionList = ({ questions, onEdit, onDelete, lang }) => {
    return (
        <div className="space-y-2">
            {questions.map((q, index) => (
                <SortableQuestionItem
                    key={q.id}
                    question={q}
                    index={index}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    lang={lang}
                />
            ))}
        </div>
    );
};

export default TestQuestionList;
