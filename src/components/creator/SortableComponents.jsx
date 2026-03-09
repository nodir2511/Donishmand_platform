import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    GripVertical, Trash2, Edit3, ArrowRightLeft, FileText, Video, ClipboardList, Presentation
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const LESSON_TYPES = [
    { id: 'video', icon: Video, label: 'creator.video' },
    { id: 'text', icon: FileText, label: 'creator.text' },
    { id: 'test', icon: ClipboardList, label: 'creator.test' },
    { id: 'presentation', icon: Presentation, label: 'creator.presentation' },
];

// Компонент сортируемого раздела
export const SortableSection = ({ section, sectionIndex, children, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-gaming-bg/30 rounded-2xl sm:rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-start sm:items-center p-2 sm:p-4 gap-2 sm:gap-3">
                <div {...attributes} {...listeners} className="cursor-grab text-gaming-textMuted hover:text-white shrink-0 mt-1 sm:mt-0">
                    <GripVertical size={18} />
                </div>
                {children}
            </div>
        </div>
    );
};

// Компонент сортируемой темы
export const SortableTopic = ({ topic, topicIndex, sectionIndex, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-gaming-card/40 rounded-xl border border-white/5 overflow-hidden w-full">
            <div className="flex items-start sm:items-center p-1.5 sm:p-3 gap-2 sm:gap-2">
                <div {...attributes} {...listeners} className="cursor-grab text-gaming-textMuted hover:text-white shrink-0 mt-1 sm:mt-0 block">
                    <GripVertical size={16} />
                </div>
                {children}
            </div>
        </div>
    );
};

// Компонент сортируемого урока (мемоизирован — листовой элемент дерева)
const SortableLessonInner = ({ lesson, lessonIndex, sectionIndex, topicIndex, onDelete, onEdit, getLessonIcon }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
    const contentTypes = [];
    if (lesson.content) {
        if (lesson.content.video?.url || lesson.content.video?.urlTj) contentTypes.push('video');
        if ((lesson.content.slidesRu?.length || 0) > 0 || (lesson.content.slidesTj?.length || 0) > 0) contentTypes.push('presentation');
        if ((lesson.content.test?.questions?.length || 0) > 0) contentTypes.push('test');
        if (lesson.content.textRu || lesson.content.textTj) contentTypes.push('text');
    }
    if (contentTypes.length === 0) contentTypes.push(lesson.type || 'text');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gaming-bg/30 rounded-lg border border-white/5 group">
            <div
                className="flex-1 min-w-0 flex items-start sm:items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-white/5 p-1 rounded-md transition-colors"
                onClick={() => onEdit(lesson)}
                title={t('creator.clickToEdit')}
            >
                <div {...attributes} {...listeners} className="cursor-grab text-gaming-textMuted hover:text-white shrink-0 mt-0.5 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                    <GripVertical size={14} />
                </div>

                {/* Иконки типов контента */}
                <div className="flex gap-1 shrink-0 mt-0.5 sm:mt-0">
                    {contentTypes.map(type => {
                        const Icon = getLessonIcon(type);
                        return <Icon key={type} size={14} className="text-gaming-pink/70" title={t(LESSON_TYPES.find(lt => lt.id === type)?.label)} />;
                    })}
                </div>

                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium break-words line-clamp-2 leading-tight w-full hover:text-gaming-primary transition-colors">
                        {sectionIndex + 1}.{topicIndex + 1}.{lessonIndex + 1}. {lang === 'tj' ? (lesson.titleTj || lesson.title) : lesson.title}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-end w-full sm:w-auto gap-2 shrink-0 bg-transparent sm:bg-transparent px-1 sm:px-0 py-1 sm:py-0 border-t border-white/5 sm:border-none pt-2 sm:pt-0 mt-1 sm:mt-0">
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(lesson, 'rename'); }}
                    className="p-1 sm:p-1.5 text-gaming-textMuted hover:text-gaming-accent sm:opacity-0 group-hover:opacity-100 transition-colors bg-gaming-bg/50 sm:bg-transparent rounded"
                    title={t('creator.editTitle')}
                >
                    <Edit3 size={14} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(lesson, 'move'); }}
                    className="p-1 sm:p-1.5 text-gaming-textMuted hover:text-gaming-accent transition-colors bg-gaming-bg/50 sm:bg-transparent rounded"
                    title={t('creator.move')}
                >
                    <ArrowRightLeft size={14} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }}
                    className="p-1 sm:p-1.5 text-gaming-textMuted hover:text-red-400 transition-colors bg-gaming-bg/50 sm:bg-transparent rounded"
                    title={t('creator.delete')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
export const SortableLesson = React.memo(SortableLessonInner);

// Компонент модального окна перемещения
export const MoveModal = ({ item, itemType, syllabus, onMove, onClose }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const [selectedSectionId, setSelectedSectionId] = useState(item.fromSectionId || '');
    const [selectedTopicId, setSelectedTopicId] = useState(item.fromTopicId || '');

    const sections = syllabus.sections || [];
    const currentSection = sections.find(s => s.id === selectedSectionId);
    const availableTopics = currentSection?.topics || [];

    const handleConfirm = () => {
        if (itemType === 'topic') {
            if (selectedSectionId && selectedSectionId !== item.fromSectionId) {
                onMove(selectedSectionId);
            }
        } else if (itemType === 'lesson') {
            if (selectedSectionId && selectedTopicId) {
                if (selectedSectionId !== item.fromSectionId || selectedTopicId !== item.fromTopicId) {
                    onMove(selectedSectionId, selectedTopicId);
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-gaming-card/95 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">
                    {t('creator.moveTo')}
                </h3>

                {/* Выбор раздела */}
                <div className="mb-4">
                    <label className="block text-sm text-gaming-textMuted mb-2">
                        {t('creator.section')}
                    </label>
                    <select
                        value={selectedSectionId}
                        onChange={(e) => { setSelectedSectionId(e.target.value); setSelectedTopicId(''); }}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none"
                    >
                        <option value="">{t('creator.selectSection')}</option>
                        {sections.map(s => (
                            <option key={s.id} value={s.id}>{lang === 'tj' ? (s.titleTj || s.title) : s.title}</option>
                        ))}
                    </select>
                </div>

                {/* Выбор темы (только для уроков) */}
                {itemType === 'lesson' && (
                    <div className="mb-4">
                        <label className="block text-sm text-gaming-textMuted mb-2">
                            {t('creator.topic')}
                        </label>
                        <select
                            value={selectedTopicId}
                            onChange={(e) => setSelectedTopicId(e.target.value)}
                            disabled={!selectedSectionId}
                            className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none disabled:opacity-50"
                        >
                            <option value="">{t('creator.selectTopic')}</option>
                            {availableTopics.map(t => (
                                <option key={t.id} value={t.id}>{lang === 'tj' ? (t.titleTj || t.title) : t.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-gaming-primary text-white rounded-xl hover:bg-gaming-primary/80"
                        disabled={itemType === 'topic' ? !selectedSectionId : (!selectedSectionId || !selectedTopicId)}
                    >
                        {t('creator.move')}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-gaming-textMuted hover:text-white">
                        {t('creator.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};
