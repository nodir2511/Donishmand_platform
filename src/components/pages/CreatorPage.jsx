import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, Trash2, Save, FolderPlus, FileText, Video, ClipboardList, Presentation,
    ChevronDown, ChevronRight, Sparkles, Book, Layers, GraduationCap, GripVertical, Edit3, ArrowRightLeft, Loader2
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SUBJECT_NAMES, ALL_SUBJECTS_LIST } from '../../constants/data';
import { MOCK_SYLLABUS } from '../../constants/syllabus';
import LessonContentEditor from '../creator/LessonContentEditor';
import { translateText } from '../../services/translationService';



const LESSON_TYPES = [
    { id: 'video', icon: Video, label: { ru: 'Видео', tj: 'Видео' } },
    { id: 'text', icon: FileText, label: { ru: 'Текст', tj: 'Матн' } },
    { id: 'test', icon: ClipboardList, label: { ru: 'Тест', tj: 'Тест' } },
    { id: 'presentation', icon: Presentation, label: { ru: 'Презентация', tj: 'Презентатсия' } },
];

const STORAGE_KEY = 'donishmand_creator_syllabus';

// Компонент сортируемого раздела
const SortableSection = ({ section, sectionIndex, children, lang, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-gaming-bg/30 rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center p-4">
                <div {...attributes} {...listeners} className="cursor-grab mr-3 text-gaming-textMuted hover:text-white">
                    <GripVertical size={18} />
                </div>
                {children}
            </div>
        </div>
    );
};

// Компонент сортируемой темы
const SortableTopic = ({ topic, topicIndex, sectionIndex, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-gaming-card/40 rounded-xl border border-white/5 overflow-hidden">
            <div className="flex items-center p-3">
                <div {...attributes} {...listeners} className="cursor-grab mr-2 text-gaming-textMuted hover:text-white">
                    <GripVertical size={16} />
                </div>
                {children}
            </div>
        </div>
    );
};

// Компонент сортируемого урока
const SortableLesson = ({ lesson, lessonIndex, sectionIndex, topicIndex, lang, onDelete, onEdit, getLessonIcon }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
    const LessonIcon = getLessonIcon(lesson.type);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 bg-gaming-bg/30 rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
                <div {...attributes} {...listeners} className="cursor-grab text-gaming-textMuted hover:text-white">
                    <GripVertical size={14} />
                </div>
                <LessonIcon size={14} className="text-gaming-pink" />
                <span className="text-sm">
                    {sectionIndex + 1}.{topicIndex + 1}.{lessonIndex + 1}. {lang === 'tj' ? (lesson.titleTj || lesson.title) : lesson.title}
                </span>
                <span className="text-xs px-2 py-0.5 bg-gaming-card/50 rounded-full text-gaming-textMuted">
                    {LESSON_TYPES.find(lt => lt.id === lesson.type)?.label[lang] || lesson.type}
                </span>
            </div>
            <div className="flex items-center gap-1">
                {/* Move Button */}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(lesson, 'move'); }}
                    className="p-1 text-gaming-textMuted hover:text-gaming-accent transition-colors"
                    title={lang === 'ru' ? 'Переместить' : 'Кӯчонидан'}
                >
                    <ArrowRightLeft size={14} />
                </button>

                <button
                    onClick={() => onEdit(lesson)}
                    className="p-1 text-gaming-accent hover:text-gaming-accent/80 transition-colors"
                    title={lang === 'ru' ? 'Редактировать содержимое' : 'Таҳрири мундариҷа'}
                >
                    <Edit3 size={14} />
                </button>
                <button
                    onClick={() => onDelete(lesson.id)}
                    className="p-1 text-gaming-textMuted hover:text-red-400 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

// Компонент модального окна перемещения
const MoveModal = ({ item, itemType, syllabus, onMove, onClose, lang }) => {
    const [selectedSectionId, setSelectedSectionId] = useState(item.fromSectionId || '');
    const [selectedTopicId, setSelectedTopicId] = useState(item.fromTopicId || '');

    // Получить доступные разделы (фильтруем текущий если нужно, но обычно можно оставить)
    // Для перемещения темы: цель - раздел.
    // Для перемещения урока: цель - тема (внутри раздела).

    const sections = syllabus.sections || [];

    // Получение тем на основе выбранного раздела
    const currentSection = sections.find(s => s.id === selectedSectionId);
    const availableTopics = currentSection?.topics || [];

    const handleConfirm = () => {
        if (itemType === 'topic') {
            if (selectedSectionId && selectedSectionId !== item.fromSectionId) {
                onMove(selectedSectionId);
            }
        } else if (itemType === 'lesson') {
            if (selectedSectionId && selectedTopicId) {
                // If moving to same topic, do nothing or handle reorder (but this modal is for moving *between* containers)
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
                    {lang === 'ru' ? 'Переместить в' : 'Кӯчонидан ба'}
                </h3>

                {/* Select Section */}
                <div className="mb-4">
                    <label className="block text-sm text-gaming-textMuted mb-2">
                        {lang === 'ru' ? 'Раздел' : 'Бахш'}
                    </label>
                    <select
                        value={selectedSectionId}
                        onChange={(e) => { setSelectedSectionId(e.target.value); setSelectedTopicId(''); }}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none"
                    >
                        <option value="">{lang === 'ru' ? 'Выберите раздел...' : 'Бахшро интихоб кунед...'}</option>
                        {sections.map(s => (
                            <option key={s.id} value={s.id}>{lang === 'tj' ? (s.titleTj || s.title) : s.title}</option>
                        ))}
                    </select>
                </div>

                {/* Select Topic (Only for Lessons) */}
                {itemType === 'lesson' && (
                    <div className="mb-4">
                        <label className="block text-sm text-gaming-textMuted mb-2">
                            {lang === 'ru' ? 'Тема' : 'Мавзӯъ'}
                        </label>
                        <select
                            value={selectedTopicId}
                            onChange={(e) => setSelectedTopicId(e.target.value)}
                            disabled={!selectedSectionId}
                            className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none disabled:opacity-50"
                        >
                            <option value="">{lang === 'ru' ? 'Выберите тему...' : 'Мавзӯъро интихоб кунед...'}</option>
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
                        {lang === 'ru' ? 'Переместить' : 'Кӯчонидан'}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-gaming-textMuted hover:text-white">
                        {lang === 'ru' ? 'Отмена' : 'Бекор'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreatorPage = ({ lang, t }) => {
    const navigate = useNavigate();
    const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS_LIST[0]);

    const [syllabus, setSyllabus] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { return { ...MOCK_SYLLABUS }; }
        }
        return { ...MOCK_SYLLABUS };
    });

    const [expandedSections, setExpandedSections] = useState({});
    const [expandedTopics, setExpandedTopics] = useState({});

    const [showAddSection, setShowAddSection] = useState(false);
    const [showAddTopic, setShowAddTopic] = useState(null);
    const [showAddLesson, setShowAddLesson] = useState(null);

    const [newSectionTitleRu, setNewSectionTitleRu] = useState('');
    const [newSectionTitleTj, setNewSectionTitleTj] = useState('');
    const [newTopicTitleRu, setNewTopicTitleRu] = useState('');
    const [newTopicTitleTj, setNewTopicTitleTj] = useState('');
    const [newLessonTitleRu, setNewLessonTitleRu] = useState('');
    const [newLessonTitleTj, setNewLessonTitleTj] = useState('');
    const [newLessonType, setNewLessonType] = useState('video');

    // Состояние редактора контента
    const [editingLesson, setEditingLesson] = useState(null);
    const [editingLessonContext, setEditingLessonContext] = useState(null);

    // Состояние модального окна перемещения
    const [moveModal, setMoveModal] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // СОСТОЯНИЕ DRAG-AND-DROP
    const [activeId, setActiveId] = useState(null);
    const [activeItem, setActiveItem] = useState(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(syllabus));
    }, [syllabus]);

    const currentSubjectSyllabus = syllabus[selectedSubject] || { sections: [] };

    const toggleSection = (sectionId) => setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    const toggleTopic = (topicId) => setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));

    // ОБРАБОТЧИКИ DRAG-AND-DROP (Только сортировка)
    const handleDragEnd = (event) => {
        const { active, over } = event;
        // console.log(active.id, over?.id);

        if (!over || active.id === over.id) return;

        const activeId = active.id;
        const overId = over.id;

        const isActiveSection = activeId.startsWith('sec_');
        const isActiveTopic = activeId.startsWith('top_');
        const isActiveLesson = activeId.startsWith('les_');

        // СОРТИРОВКА РАЗДЕЛОВ
        if (isActiveSection) {
            setSyllabus(prev => {
                const sections = prev[selectedSubject].sections;
                const oldIndex = sections.findIndex(s => s.id === activeId);
                const newIndex = sections.findIndex(s => s.id === overId);
                return {
                    ...prev,
                    [selectedSubject]: { ...prev[selectedSubject], sections: arrayMove(sections, oldIndex, newIndex) }
                };
            });
            return;
        }

        // СОРТИРОВКА ТЕМ (Внутри одного раздела)
        if (isActiveTopic) {
            setSyllabus(prev => {
                const sections = prev[selectedSubject].sections;
                const newSections = sections.map(sec => {
                    const topicIds = sec.topics.map(t => t.id);
                    if (topicIds.includes(activeId) && topicIds.includes(overId)) {
                        const oldIndex = sec.topics.findIndex(t => t.id === activeId);
                        const newIndex = sec.topics.findIndex(t => t.id === overId);
                        return {
                            ...sec,
                            topics: arrayMove(sec.topics, oldIndex, newIndex)
                        };
                    }
                    return sec;
                });
                return {
                    ...prev,
                    [selectedSubject]: { ...prev[selectedSubject], sections: newSections }
                };
            });
            return;
        }

        // СОРТИРОВКА УРОКОВ (Внутри одной темы)
        if (isActiveLesson) {
            setSyllabus(prev => {
                const sections = prev[selectedSubject].sections;
                const newSections = sections.map(sec => {
                    return {
                        ...sec,
                        topics: sec.topics.map(top => {
                            const lessonIds = top.lessons.map(l => l.id);
                            if (lessonIds.includes(activeId) && lessonIds.includes(overId)) {
                                const oldIndex = top.lessons.findIndex(l => l.id === activeId);
                                const newIndex = top.lessons.findIndex(l => l.id === overId);
                                return {
                                    ...top,
                                    lessons: arrayMove(top.lessons, oldIndex, newIndex)
                                };
                            }
                            return top;
                        })
                    };
                });
                return {
                    ...prev,
                    [selectedSubject]: { ...prev[selectedSubject], sections: newSections }
                };
            });
        }
    };

    // ОБРАБОТЧИКИ ДОБАВЛЕНИЯ
    const handleAddSection = () => {
        if (!newSectionTitleRu.trim()) return;
        const newSection = {
            id: `sec_${Date.now()}`,
            title: newSectionTitleRu.trim(),
            titleTj: newSectionTitleTj.trim() || autoTranslate(newSectionTitleRu.trim(), 'ru', 'tj'),
            topics: []
        };
        setSyllabus(prev => ({
            ...prev,
            [selectedSubject]: { ...prev[selectedSubject], sections: [...(prev[selectedSubject]?.sections || []), newSection] }
        }));
        setNewSectionTitleRu(''); setNewSectionTitleTj(''); setShowAddSection(false);
    };

    const handleAddTopic = (sectionId) => {
        if (!newTopicTitleRu.trim()) return;
        const newTopic = {
            id: `top_${Date.now()}`,
            title: newTopicTitleRu.trim(),
            titleTj: newTopicTitleTj.trim() || autoTranslate(newTopicTitleRu.trim(), 'ru', 'tj'),
            lessons: []
        };
        setSyllabus(prev => ({
            ...prev,
            [selectedSubject]: {
                ...prev[selectedSubject],
                sections: prev[selectedSubject].sections.map(sec =>
                    sec.id === sectionId ? { ...sec, topics: [...sec.topics, newTopic] } : sec
                )
            }
        }));
        setNewTopicTitleRu(''); setNewTopicTitleTj(''); setShowAddTopic(null);
    };

    const handleAddLesson = (sectionId, topicId) => {
        if (!newLessonTitleRu.trim()) return;
        const newLesson = {
            id: `les_${Date.now()}`,
            title: newLessonTitleRu.trim(),
            titleTj: newLessonTitleTj.trim() || autoTranslate(newLessonTitleRu.trim(), 'ru', 'tj'),
            type: newLessonType,
            content: {}
        };
        setSyllabus(prev => ({
            ...prev,
            [selectedSubject]: {
                ...prev[selectedSubject],
                sections: prev[selectedSubject].sections.map(sec =>
                    sec.id === sectionId ? {
                        ...sec,
                        topics: sec.topics.map(top =>
                            top.id === topicId ? { ...top, lessons: [...top.lessons, newLesson] } : top
                        )
                    } : sec
                )
            }
        }));
        setNewLessonTitleRu(''); setNewLessonTitleTj(''); setNewLessonType('video'); setShowAddLesson(null);
    };

    // ОБРАБОТЧИКИ УДАЛЕНИЯ
    const handleDeleteSection = (sectionId) => {
        setSyllabus(prev => ({
            ...prev,
            [selectedSubject]: { ...prev[selectedSubject], sections: prev[selectedSubject].sections.filter(sec => sec.id !== sectionId) }
        }));
    };

    const handleDeleteTopic = (sectionId, topicId) => {
        setSyllabus(prev => ({
            ...prev,
            [selectedSubject]: {
                ...prev[selectedSubject],
                sections: prev[selectedSubject].sections.map(sec =>
                    sec.id === sectionId ? { ...sec, topics: sec.topics.filter(top => top.id !== topicId) } : sec
                )
            }
        }));
    };

    const handleDeleteLesson = (sectionId, topicId, lessonId) => {
        setSyllabus(prev => ({
            ...prev,
            [selectedSubject]: {
                ...prev[selectedSubject],
                sections: prev[selectedSubject].sections.map(sec =>
                    sec.id === sectionId ? {
                        ...sec,
                        topics: sec.topics.map(top =>
                            top.id === topicId ? { ...top, lessons: top.lessons.filter(les => les.id !== lessonId) } : top
                        )
                    } : sec
                )
            }
        }));
    };


    // ОБРАБОТЧИКИ ПЕРЕМЕЩЕНИЯ
    const handleMoveTopic = (topicId, fromSectionId, toSectionId) => {
        setSyllabus(prev => {
            const newSyllabus = { ...prev };
            const subjectSyllabus = { ...newSyllabus[selectedSubject] };
            let sections = [...subjectSyllabus.sections];

            let topicToMove = null;
            let fromSectionIndex = -1;

            // Найти тему и удалить её из исходного раздела
            sections = sections.map((sec, index) => {
                if (sec.id === fromSectionId) {
                    fromSectionIndex = index;
                    const topicIndex = sec.topics.findIndex(t => t.id === topicId);
                    if (topicIndex !== -1) {
                        topicToMove = sec.topics[topicIndex];
                        return { ...sec, topics: sec.topics.filter(t => t.id !== topicId) };
                    }
                }
                return sec;
            });

            if (!topicToMove) return prev; // Тема не найдена

            // Добавить тему в целевой раздел
            sections = sections.map(sec => {
                if (sec.id === toSectionId) {
                    return { ...sec, topics: [...sec.topics, topicToMove] };
                }
                return sec;
            });

            subjectSyllabus.sections = sections;
            newSyllabus[selectedSubject] = subjectSyllabus;
            return newSyllabus;
        });
        setMoveModal(null);
    };

    const handleMoveLesson = (lessonId, fromSectionId, fromTopicId, toSectionId, toTopicId) => {
        setSyllabus(prev => {
            const newSyllabus = { ...prev };
            const subjectSyllabus = { ...newSyllabus[selectedSubject] };
            let sections = [...subjectSyllabus.sections];

            let lessonToMove = null;

            // Найти урок и удалить его из исходной темы
            sections = sections.map(sec => ({
                ...sec,
                topics: sec.topics.map(top => {
                    if (sec.id === fromSectionId && top.id === fromTopicId) {
                        const lessonIndex = top.lessons.findIndex(l => l.id === lessonId);
                        if (lessonIndex !== -1) {
                            lessonToMove = top.lessons[lessonIndex];
                            return { ...top, lessons: top.lessons.filter(l => l.id !== lessonId) };
                        }
                    }
                    return top;
                })
            }));

            if (!lessonToMove) return prev; // Урок не найден

            // Добавить урок в целевую тему
            sections = sections.map(sec => ({
                ...sec,
                topics: sec.topics.map(top => {
                    if (sec.id === toSectionId && top.id === toTopicId) {
                        return { ...top, lessons: [...top.lessons, lessonToMove] };
                    }
                    return top;
                })
            }));

            subjectSyllabus.sections = sections;
            newSyllabus[selectedSubject] = subjectSyllabus;
            return newSyllabus;
        });
        setMoveModal(null);
    };

    // ОБРАБОТЧИКИ РЕДАКТОРА КОНТЕНТА
    const handleEditLesson = (lesson, sectionId, topicId) => {
        setEditingLesson(lesson);
        setEditingLessonContext({ sectionId, topicId });
    };

    const handleSaveLesson = (updatedLesson) => {
        const { sectionId, topicId } = editingLessonContext;
        setSyllabus(prev => ({
            ...prev,
            [selectedSubject]: {
                ...prev[selectedSubject],
                sections: prev[selectedSubject].sections.map(sec =>
                    sec.id === sectionId ? {
                        ...sec,
                        topics: sec.topics.map(top =>
                            top.id === topicId ? {
                                ...top,
                                lessons: top.lessons.map(les => les.id === updatedLesson.id ? updatedLesson : les)
                            } : top
                        )
                    } : sec
                )
            }
        }));
        setEditingLesson(null);
        setEditingLessonContext(null);
    };

    // АВТО-ПЕРЕВОД
    const [translating, setTranslating] = useState({ section: false, topic: false, lesson: false });

    const handleAutoTranslateSectionRuToTj = async () => {
        setTranslating(prev => ({ ...prev, section: true }));
        try {
            const translated = await translateText(newSectionTitleRu, 'ru', 'tj');
            setNewSectionTitleTj(translated);
        } finally {
            setTranslating(prev => ({ ...prev, section: false }));
        }
    };

    const handleAutoTranslateTopicRuToTj = async () => {
        setTranslating(prev => ({ ...prev, topic: true }));
        try {
            const translated = await translateText(newTopicTitleRu, 'ru', 'tj');
            setNewTopicTitleTj(translated);
        } finally {
            setTranslating(prev => ({ ...prev, topic: false }));
        }
    };

    const handleAutoTranslateLessonRuToTj = async () => {
        setTranslating(prev => ({ ...prev, lesson: true }));
        try {
            const translated = await translateText(newLessonTitleRu, 'ru', 'tj');
            setNewLessonTitleTj(translated);
        } finally {
            setTranslating(prev => ({ ...prev, lesson: false }));
        }
    };

    const renderDualInput = (valueRu, setValueRu, valueTj, setValueTj, onAutoTranslate, placeholderRu = 'Название (RU)', placeholderTj = 'Номи (TJ)') => (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <input type="text" value={valueRu} onChange={(e) => setValueRu(e.target.value)} placeholder={placeholderRu}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-primary/50 transition-colors" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">RU</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <input type="text" value={valueTj} onChange={(e) => setValueTj(e.target.value)} placeholder={placeholderTj}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-accent/50 transition-colors" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">TJ</span>
                </div>
                <button type="button" onClick={onAutoTranslate} className="flex items-center gap-1 px-3 py-3 bg-gaming-accent/20 text-gaming-accent rounded-xl hover:bg-gaming-accent/30 transition-colors text-sm" title="Авто-перевод">
                    <Sparkles size={16} />
                </button>
            </div>
        </div>
    );

    const getLessonIcon = (type) => {
        const found = LESSON_TYPES.find(lt => lt.id === type);
        return found ? found.icon : FileText;
    };

    // Получить все темы для модального окна перемещения
    const getAllTopics = () => currentSubjectSyllabus.sections.flatMap(s => s.topics.map(t => ({ ...t, sectionTitle: s.title })));

    return (
        <div className="min-h-screen bg-gaming-bg font-sans text-white p-6">
            {/* Шапка */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gaming-textMuted hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                    {lang === 'ru' ? 'Назад' : 'Бозгашт'}
                </button>
            </div>

            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <GraduationCap className="text-gaming-primary" size={40} />
                {lang === 'ru' ? 'Панель Создателя' : 'Панели Эҷодкор'}
            </h1>
            <p className="text-gaming-textMuted text-lg mb-8">
                {lang === 'ru' ? 'Добавляйте разделы, темы и уроки. Перетаскивайте для сортировки.' : 'Бахшҳо, мавзӯъҳо ва дарсҳоро илова кунед. Барои мураттаб кардан кашед.'}
            </p>

            {/* Селектор предмета */}
            <div className="mb-8">
                <label className="block text-sm text-gaming-textMuted mb-2">{lang === 'ru' ? 'Выберите предмет' : 'Фанро интихоб кунед'}</label>
                <div className="relative">
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full max-w-md bg-gaming-card/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-gaming-primary/50 transition-colors">
                        {ALL_SUBJECTS_LIST.map(subjectId => (
                            <option key={subjectId} value={subjectId} className="bg-gaming-card text-white">{SUBJECT_NAMES[subjectId]?.[lang] || subjectId}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gaming-textMuted pointer-events-none" size={20} />
                </div>
            </div>

            {/* Область контента */}
            <div className="bg-gaming-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="text-gaming-primary" size={24} />
                        {lang === 'ru' ? 'Разделы' : 'Бахшҳо'}
                    </h2>
                    <button onClick={() => setShowAddSection(true)} className="flex items-center gap-2 px-4 py-2 bg-gaming-primary/20 text-gaming-primary rounded-xl hover:bg-gaming-primary/30 transition-colors active:scale-95">
                        <FolderPlus size={18} />
                        {lang === 'ru' ? 'Добавить раздел' : 'Илова кардани бахш'}
                    </button>
                </div>

                {/* Форма добавления раздела */}
                {showAddSection && (
                    <div className="mb-6 p-4 bg-gaming-bg/50 rounded-2xl border border-gaming-primary/30">
                        <h3 className="text-lg font-semibold mb-4 text-gaming-primary">{lang === 'ru' ? 'Новый раздел' : 'Бахши нав'}</h3>
                        {renderDualInput(newSectionTitleRu, setNewSectionTitleRu, newSectionTitleTj, setNewSectionTitleTj, handleAutoTranslateSectionRuToTj)}
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleAddSection} className="flex items-center gap-2 px-4 py-2 bg-gaming-primary text-white rounded-xl hover:bg-gaming-primary/80 transition-colors active:scale-95">
                                <Save size={16} />{lang === 'ru' ? 'Сохранить' : 'Нигоҳ доштан'}
                            </button>
                            <button onClick={() => { setShowAddSection(false); setNewSectionTitleRu(''); setNewSectionTitleTj(''); }} className="px-4 py-2 text-gaming-textMuted hover:text-white transition-colors">
                                {lang === 'ru' ? 'Отмена' : 'Бекор кардан'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Список разделов с Drag-and-Drop */}
                {currentSubjectSyllabus.sections.length === 0 ? (
                    <div className="text-center py-12 text-gaming-textMuted">
                        <Book size={48} className="mx-auto mb-4 opacity-30" />
                        <p>{lang === 'ru' ? 'Пока нет разделов. Добавьте первый!' : 'Ҳанӯз бахше нест. Аввалинро илова кунед!'}</p>
                    </div>
                ) : (
                    /* DND CONTEXT - SIMPLE SORTING ONLY */
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={currentSubjectSyllabus.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {currentSubjectSyllabus.sections.map((section, sectionIndex) => (
                                    <SortableSection key={section.id} section={section} sectionIndex={sectionIndex} lang={lang} onDelete={handleDeleteSection}>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection(section.id)}>
                                                <div className="flex items-center gap-3">
                                                    {expandedSections[section.id] ? <ChevronDown size={20} className="text-gaming-primary" /> : <ChevronRight size={20} className="text-gaming-textMuted" />}
                                                    <span className="text-lg font-semibold">{sectionIndex + 1}. {lang === 'tj' ? (section.titleTj || section.title) : section.title}</span>
                                                    <span className="text-sm text-gaming-textMuted">({section.topics?.length || 0} {lang === 'ru' ? 'тем' : 'мавзӯъ'})</span>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} className="p-2 text-gaming-textMuted hover:text-red-400 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {expandedSections[section.id] && (
                                                <div className="mt-4 ml-8">
                                                    <button onClick={() => setShowAddTopic(section.id)} className="flex items-center gap-2 px-3 py-2 mb-4 text-sm text-gaming-accent hover:bg-gaming-accent/10 rounded-lg transition-colors">
                                                        <Plus size={16} />{lang === 'ru' ? 'Добавить тему' : 'Илова кардани мавзӯъ'}
                                                    </button>

                                                    {showAddTopic === section.id && (
                                                        <div className="mb-4 p-4 bg-gaming-card/50 rounded-xl border border-gaming-accent/30">
                                                            <h4 className="text-md font-semibold mb-3 text-gaming-accent">{lang === 'ru' ? 'Новая тема' : 'Мавзӯи нав'}</h4>
                                                            {renderDualInput(newTopicTitleRu, setNewTopicTitleRu, newTopicTitleTj, setNewTopicTitleTj, handleAutoTranslateTopicRuToTj)}
                                                            <div className="flex gap-3 mt-4">
                                                                <button onClick={() => handleAddTopic(section.id)} className="flex items-center gap-2 px-3 py-2 bg-gaming-accent text-white rounded-lg hover:bg-gaming-accent/80 transition-colors active:scale-95 text-sm">
                                                                    <Save size={14} />{lang === 'ru' ? 'Сохранить' : 'Нигоҳ доштан'}
                                                                </button>
                                                                <button onClick={() => { setShowAddTopic(null); setNewTopicTitleRu(''); setNewTopicTitleTj(''); }} className="px-3 py-2 text-gaming-textMuted hover:text-white transition-colors text-sm">
                                                                    {lang === 'ru' ? 'Отмена' : 'Бекор кардан'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {section.topics?.length === 0 ? (
                                                        <p className="text-sm text-gaming-textMuted">{lang === 'ru' ? 'Нет тем' : 'Мавзӯе нест'}</p>
                                                    ) : (
                                                        <SortableContext items={section.topics.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                                            <div className="space-y-3">
                                                                {section.topics.map((topic, topicIndex) => (
                                                                    <SortableTopic key={topic.id} topic={topic} topicIndex={topicIndex} sectionIndex={sectionIndex}>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleTopic(topic.id)}>
                                                                                <div className="flex items-center gap-2">
                                                                                    {expandedTopics[topic.id] ? <ChevronDown size={16} className="text-gaming-accent" /> : <ChevronRight size={16} className="text-gaming-textMuted" />}
                                                                                    <span className="font-medium">{sectionIndex + 1}.{topicIndex + 1}. {lang === 'tj' ? (topic.titleTj || topic.title) : topic.title}</span>
                                                                                    <span className="text-xs text-gaming-textMuted">({topic.lessons?.length || 0} {lang === 'ru' ? 'уроков' : 'дарс'})</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <button onClick={(e) => { e.stopPropagation(); setMoveModal({ type: 'topic', id: topic.id, fromSectionId: section.id }); }} className="p-1 text-gaming-textMuted hover:text-gaming-accent transition-colors" title={lang === 'ru' ? 'Переместить' : 'Кӯчонидан'}>
                                                                                        <ArrowRightLeft size={14} />
                                                                                    </button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(section.id, topic.id); }} className="p-1 text-gaming-textMuted hover:text-red-400 transition-colors">
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {expandedTopics[topic.id] && (
                                                                                <div className="mt-3 ml-6">
                                                                                    <button onClick={() => setShowAddLesson({ sectionId: section.id, topicId: topic.id })} className="flex items-center gap-2 px-2 py-1 mb-3 text-xs text-gaming-pink hover:bg-gaming-pink/10 rounded-lg transition-colors">
                                                                                        <Plus size={14} />{lang === 'ru' ? 'Добавить урок' : 'Илова кардани дарс'}
                                                                                    </button>

                                                                                    {showAddLesson?.sectionId === section.id && showAddLesson?.topicId === topic.id && (
                                                                                        <div className="mb-3 p-3 bg-gaming-bg/50 rounded-lg border border-gaming-pink/30">
                                                                                            <h5 className="text-sm font-semibold mb-3 text-gaming-pink">{lang === 'ru' ? 'Новый урок' : 'Дарси нав'}</h5>
                                                                                            {renderDualInput(newLessonTitleRu, setNewLessonTitleRu, newLessonTitleTj, setNewLessonTitleTj, handleAutoTranslateLessonRuToTj)}
                                                                                            <div className="mt-3">
                                                                                                <label className="block text-xs text-gaming-textMuted mb-2">{lang === 'ru' ? 'Тип урока' : 'Намуди дарс'}</label>
                                                                                                <div className="flex flex-wrap gap-2">
                                                                                                    {LESSON_TYPES.map(lt => {
                                                                                                        const Icon = lt.icon;
                                                                                                        const isActive = newLessonType === lt.id;
                                                                                                        return (
                                                                                                            <button key={lt.id} onClick={() => setNewLessonType(lt.id)}
                                                                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isActive ? 'bg-gaming-pink text-white' : 'bg-gaming-card/50 text-gaming-textMuted hover:text-white'}`}>
                                                                                                                <Icon size={14} />{lt.label[lang]}
                                                                                                            </button>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex gap-2 mt-4">
                                                                                                <button onClick={() => handleAddLesson(section.id, topic.id)} className="flex items-center gap-2 px-3 py-2 bg-gaming-pink text-white rounded-lg hover:bg-gaming-pink/80 transition-colors active:scale-95 text-xs">
                                                                                                    <Save size={12} />{lang === 'ru' ? 'Сохранить' : 'Нигоҳ доштан'}
                                                                                                </button>
                                                                                                <button onClick={() => { setShowAddLesson(null); setNewLessonTitleRu(''); setNewLessonTitleTj(''); }} className="px-3 py-2 text-gaming-textMuted hover:text-white transition-colors text-xs">
                                                                                                    {lang === 'ru' ? 'Отмена' : 'Бекор кардан'}
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {topic.lessons?.length === 0 ? (
                                                                                        <p className="text-xs text-gaming-textMuted">{lang === 'ru' ? 'Нет уроков' : 'Дарсе нест'}</p>
                                                                                    ) : (
                                                                                        <SortableContext items={topic.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                                                                            <div className="space-y-2">
                                                                                                {topic.lessons.map((lesson, lessonIndex) => (
                                                                                                    <SortableLesson
                                                                                                        key={lesson.id}
                                                                                                        lesson={lesson}
                                                                                                        lessonIndex={lessonIndex}
                                                                                                        sectionIndex={sectionIndex}
                                                                                                        topicIndex={topicIndex}
                                                                                                        lang={lang}
                                                                                                        onDelete={(lessonId) => handleDeleteLesson(section.id, topic.id, lessonId)}
                                                                                                        onEdit={(les, action) => {
                                                                                                            if (action === 'move') {
                                                                                                                setMoveModal({ type: 'lesson', id: lesson.id, fromSectionId: section.id, fromTopicId: topic.id });
                                                                                                            } else {
                                                                                                                handleEditLesson(les, section.id, topic.id);
                                                                                                            }
                                                                                                        }}
                                                                                                        getLessonIcon={getLessonIcon}
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                        </SortableContext>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </SortableTopic>
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </SortableSection>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Модальное окно редактора контента */}
            {editingLesson && (
                <LessonContentEditor
                    lesson={editingLesson}
                    onSave={handleSaveLesson}
                    onClose={() => { setEditingLesson(null); setEditingLessonContext(null); }}
                    lang={lang}
                />
            )}

            {/* Модальное окно перемещения */}
            {moveModal && (
                <MoveModal
                    item={moveModal}
                    itemType={moveModal.type}
                    syllabus={syllabus[selectedSubject] || { sections: [] }}
                    onMove={(targetSectionId, targetTopicId) => {
                        if (moveModal.type === 'topic') handleMoveTopic(moveModal.id, moveModal.fromSectionId, targetSectionId);
                        if (moveModal.type === 'lesson') handleMoveLesson(moveModal.id, moveModal.fromSectionId, moveModal.fromTopicId, targetSectionId, targetTopicId);
                    }}
                    onClose={() => setMoveModal(null)}
                    lang={lang}
                />
            )}        </div >
    );
};

export default CreatorPage;
