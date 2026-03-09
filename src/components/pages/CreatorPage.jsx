import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, Trash2, Save, FileText, Video, ClipboardList, Presentation,
    ChevronDown, ChevronRight, Edit3, ArrowRightLeft, Loader2, GraduationCap,
    FolderPlus, Book, Layers, Sparkles
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSection, SortableTopic, SortableLesson, MoveModal } from '../creator/SortableComponents';
import { SUBJECT_NAMES, ALL_SUBJECTS_LIST } from '../../constants/data';
const LessonContentEditor = React.lazy(() => import('../creator/LessonContentEditor'));
import ComponentErrorBoundary from '../common/ComponentErrorBoundary';
import { translationService, syllabusService } from '../../services/apiService';




import { invalidateSyllabusCache } from '../../contexts/SyllabusContext';
import useDebounce from '../../hooks/useDebounce';

const LESSON_TYPES = [
    { id: 'video', icon: Video, label: 'creator.video' },
    { id: 'text', icon: FileText, label: 'creator.text' },
    { id: 'test', icon: ClipboardList, label: 'creator.test' },
    { id: 'presentation', icon: Presentation, label: 'creator.presentation' },
];

const STORAGE_KEY = 'donishmand_creator_syllabus';

const CreatorPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const navigate = useNavigate();

    // Состояние выбранного предмета с персистенцией
    const [selectedSubject, setSelectedSubject] = useState(() => {
        const saved = localStorage.getItem('creator_selected_subject');
        return (saved && ALL_SUBJECTS_LIST.includes(saved)) ? saved : ALL_SUBJECTS_LIST[0];
    });

    useEffect(() => {
        localStorage.setItem('creator_selected_subject', selectedSubject);
    }, [selectedSubject]);

    const [syllabus, setSyllabus] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { /* Ошибка парсинга */ }
        }
        // Пустая структура для каждого предмета
        const empty = {};
        ALL_SUBJECTS_LIST.forEach(id => { empty[id] = { sections: [] }; });
        return empty;
    });

    // --- ЛОГИКА АВТО-СОХРАНЕНИЯ НАЧАЛО ---
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' (сохранено), 'saving' (сохранение), 'error' (ошибка)
    const debouncedSyllabus = useDebounce(syllabus, 2000); // Ждем 2 сек после последнего изменения

    // Guard: блокируем auto-save до завершения загрузки данных из Supabase
    const isCloudLoaded = useRef(false);

    useEffect(() => {
        // Пропускаем начальную загрузку или пустой объект
        if (!debouncedSyllabus) return;
        // Не сохраняем в облако, пока не загрузили актуальные данные из Supabase
        if (!isCloudLoaded.current) return;

        const syncToCloud = async () => {
            setSaveStatus('saving');
            try {
                // Сохраняем структуру для ТЕКУЩЕГО предмета.
                // Мы исходим из того, что пользователь редактирует только выбранный предмет.

                if (debouncedSyllabus[selectedSubject]) {
                    await syllabusService.saveStructure(selectedSubject, debouncedSyllabus[selectedSubject]);
                    // Сбрасываем кеш, чтобы навигационные страницы загрузили свежие данные
                    invalidateSyllabusCache(selectedSubject);
                }
                setSaveStatus('saved');
            } catch (error) {
                console.error('Ошибка авто-сохранения:', error);
                setSaveStatus('error');
            }
        };

        syncToCloud();
    }, [debouncedSyllabus, selectedSubject]);
    // --- ЛОГИКА АВТО-СОХРАНЕНИЯ КОНЕЦ ---

    const [newLessonType, setNewLessonType] = useState('text'); // Больше не используется явно, но оставим для совместимости
    const [moveModal, setMoveModal] = useState(null);

    // Состояние раскрытых элементов с персистенцией
    const [expandedSections, setExpandedSections] = useState(() => {
        try {
            const saved = localStorage.getItem('creator_expanded_sections');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [expandedTopics, setExpandedTopics] = useState(() => {
        try {
            const saved = localStorage.getItem('creator_expanded_topics');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    // Сохранение состояния раскрытых элементов
    useEffect(() => {
        localStorage.setItem('creator_expanded_sections', JSON.stringify(expandedSections));
    }, [expandedSections]);

    useEffect(() => {
        localStorage.setItem('creator_expanded_topics', JSON.stringify(expandedTopics));
    }, [expandedTopics]);

    // Сохранение скролла
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('creator_scroll_position', window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Восстановление скролла
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('creator_scroll_position');
        if (savedScroll) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll));
            }, 100);
        }
    }, [syllabus]); // Пробуем восстановить когда загрузились данные

    const [showAddSection, setShowAddSection] = useState(false);
    const [showAddTopic, setShowAddTopic] = useState(null);
    const [showAddLesson, setShowAddLesson] = useState(null);

    const [newSectionTitleRu, setNewSectionTitleRu] = useState('');
    const [newSectionTitleTj, setNewSectionTitleTj] = useState('');
    const [newTopicTitleRu, setNewTopicTitleRu] = useState('');
    const [newTopicTitleTj, setNewTopicTitleTj] = useState('');
    const [newLessonTitleRu, setNewLessonTitleRu] = useState('');
    const [newLessonTitleTj, setNewLessonTitleTj] = useState('');

    // Состояние редактора контента
    const [editingLesson, setEditingLesson] = useState(null);
    const [editingLessonContext, setEditingLessonContext] = useState(null);

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

    const currentSubjectSyllabus = useMemo(() => syllabus[selectedSubject] || { sections: [] }, [syllabus, selectedSubject]);

    const toggleSection = useCallback((sectionId) => setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] })), []);
    const toggleTopic = useCallback((topicId) => setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] })), []);

    // ОБРАБОТЧИКИ DRAG-AND-DROP (Только сортировка)
    const handleDragEnd = useCallback((event) => {
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
    }, [selectedSubject]);

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
            type: 'text', // Тип по умолчанию, будет обновлен на основе контента
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
    const handleDeleteSection = useCallback(async (sectionId) => {
        if (!window.confirm('Вы точно хотите удалить этот раздел и все его уроки? Это действие нельзя отменить.')) return;

        try {
            const section = syllabus[selectedSubject]?.sections.find(s => s.id === sectionId);
            if (section) {
                const lessonIds = section.topics.flatMap(t => t.lessons.map(l => l.id));
                if (lessonIds.length > 0) {
                    await syllabusService.deleteLessons(lessonIds).catch(console.error);
                }
            }

            setSyllabus(prev => ({
                ...prev,
                [selectedSubject]: { ...prev[selectedSubject], sections: prev[selectedSubject].sections.filter(sec => sec.id !== sectionId) }
            }));
            invalidateSyllabusCache(selectedSubject);
        } catch (error) {
            console.error('Ошибка удаления раздела: ', error);
        }
    }, [syllabus, selectedSubject, t]);

    const handleDeleteTopic = useCallback(async (sectionId, topicId) => {
        if (!window.confirm('Вы точно хотите удалить эту тему и все её уроки? Это действие нельзя отменить.')) return;

        try {
            const section = syllabus[selectedSubject]?.sections.find(s => s.id === sectionId);
            const topic = section?.topics.find(t => t.id === topicId);
            if (topic) {
                const lessonIds = topic.lessons.map(l => l.id);
                if (lessonIds.length > 0) {
                    await syllabusService.deleteLessons(lessonIds).catch(console.error);
                }
            }

            setSyllabus(prev => ({
                ...prev,
                [selectedSubject]: {
                    ...prev[selectedSubject],
                    sections: prev[selectedSubject].sections.map(sec =>
                        sec.id === sectionId ? { ...sec, topics: sec.topics.filter(top => top.id !== topicId) } : sec
                    )
                }
            }));
            invalidateSyllabusCache(selectedSubject);
        } catch (error) {
            console.error('Ошибка удаления темы: ', error);
        }
    }, [syllabus, selectedSubject, t]);

    const handleDeleteLesson = useCallback(async (sectionId, topicId, lessonId) => {
        if (!window.confirm(t('creator.confirmDelete'))) return;

        try {
            await syllabusService.deleteLesson(lessonId);

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
            // Сбрасываем кэш, так как структура могла сломаться если урок останется в индексе
            invalidateSyllabusCache(selectedSubject);
        } catch (error) {
            console.error('Ошибка удаления урока из БД:', error);
            alert('Не удалось полностью удалить контент урока из базы данных.');
        }
    }, [selectedSubject, t]);


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
            const subjectData = newSyllabus[selectedSubject];
            if (!subjectData) return prev;

            const fromSection = subjectData.sections.find(s => s.id === fromSectionId);
            const toSection = subjectData.sections.find(s => s.id === toSectionId);
            if (!fromSection || !toSection) return prev;

            const fromTopic = fromSection.topics.find(t => t.id === fromTopicId);
            const toTopic = toSection.topics.find(t => t.id === toTopicId);
            if (!fromTopic || !toTopic) return prev;

            const lessonIndex = fromTopic.lessons.findIndex(l => l.id === lessonId);
            if (lessonIndex === -1) return prev;

            const [movedLesson] = fromTopic.lessons.splice(lessonIndex, 1);
            toTopic.lessons.push(movedLesson);

            return newSyllabus;
        });
        setMoveModal(null);
    };

    // ОБРАБОТЧИКИ ПЕРЕИМЕНОВАНИЯ
    const [renameModal, setRenameModal] = useState(null);

    const handleRename = (data) => {
        setSyllabus(prev => {
            const newSyllabus = { ...prev };
            const subjectData = newSyllabus[selectedSubject];
            if (!subjectData) return prev;

            if (data.type === 'section') {
                const section = subjectData.sections.find(s => s.id === data.id);
                if (section) {
                    section.title = data.titleRu;
                    section.titleTj = data.titleTj;
                }
            } else if (data.type === 'topic') {
                const section = subjectData.sections.find(s => s.id === data.sectionId);
                const topic = section?.topics.find(t => t.id === data.id);
                if (topic) {
                    topic.title = data.titleRu;
                    topic.titleTj = data.titleTj;
                }
            } else if (data.type === 'lesson') {
                const section = subjectData.sections.find(s => s.id === data.sectionId);
                const topic = section?.topics.find(t => t.id === data.topicId);
                const lesson = topic?.lessons.find(l => l.id === data.id);
                if (lesson) {
                    lesson.title = data.titleRu;
                    lesson.titleTj = data.titleTj;
                }
            }

            return newSyllabus;
        });
        setRenameModal(null);
    };

    // --- СИНХРОНИЗАЦИЯ С ОБЛАКОМ (ЗАГРУЗКА) ---
    useEffect(() => {
        const loadFromCloud = async () => {
            // Блокируем auto-save на время загрузки из облака
            isCloudLoaded.current = false;
            try {
                setSaveStatus('saving');

                const cloudData = await syllabusService.getStructure(selectedSubject);
                if (cloudData) {
                    setSyllabus(prev => ({
                        ...prev,
                        [selectedSubject]: cloudData // В БД лежит объект { sections: [...] }
                    }));
                }
                setSaveStatus('saved');
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                // Разрешаем auto-save только после успешной загрузки из облака
                isCloudLoaded.current = true;
            }
        };

        loadFromCloud();
    }, [selectedSubject]);


    // ОБРАБОТЧИКИ РЕДАКТОРА КОНТЕНТА
    const [isLoadingLesson, setIsLoadingLesson] = useState(false);

    const handleEditLesson = async (lesson, sectionId, topicId) => {
        setIsLoadingLesson(true);
        try {
            let lessonToEdit = lesson;

            // Если контента нет (он не загружен в структуру), загружаем его отдельно
            // Проверяем наличие ключей контента или явно поле content
            if (!lesson.content) {
                const loadedLesson = await syllabusService.getLesson(lesson.id);
                if (loadedLesson && loadedLesson.content) {
                    lessonToEdit = { ...lesson, content: loadedLesson.content };

                    // Обновим локальный стейт, чтобы закешировать загруженный контент
                    // (Опционально, но полезно, чтобы при повторном открытии не качать)
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
                                            lessons: top.lessons.map(les => les.id === lesson.id ? lessonToEdit : les)
                                        } : top
                                    )
                                } : sec
                            )
                        }
                    }));
                }
            }

            setEditingLesson(lessonToEdit);
            setEditingLessonContext({ sectionId, topicId });
        } catch (error) {
            console.error('Ошибка подготовки урока:', error);
            alert('Не удалось загрузить урок');
        } finally {
            setIsLoadingLesson(false);
        }
    };

    const [isLessonSaving, setIsLessonSaving] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving', 'saved', 'error', null

    const handleAutoSaveLesson = async (updatedContent) => {
        if (!editingLessonContext || !editingLesson) return;

        setAutoSaveStatus('saving');
        try {
            const updatedLesson = { ...editingLesson, content: updatedContent };

            let detectedType = 'text';
            if ((updatedLesson.content.test?.questions?.length || 0) > 0) detectedType = 'test';
            else if (updatedLesson.content.video?.url || updatedLesson.content.video?.urlTj) detectedType = 'video';
            else if ((updatedLesson.content.slidesRu?.length || 0) > 0 || (updatedLesson.content.slidesTj?.length || 0) > 0) detectedType = 'presentation';

            const lessonToSave = { ...updatedLesson, type: detectedType };

            await syllabusService.saveLesson(lessonToSave, selectedSubject);

            setEditingLesson(lessonToSave);

            setAutoSaveStatus('saved');
            setTimeout(() => setAutoSaveStatus(null), 3000);
        } catch (error) {
            console.error('Ошибка автосохранения:', error);
            setAutoSaveStatus('error');
        }
    };

    const handleSaveLesson = async (updatedLesson) => {
        setIsLessonSaving(true);
        try {
            const { sectionId, topicId } = editingLessonContext;

            // 1. Определяем тип урока на основе контента
            let detectedType = 'text';
            if ((updatedLesson.content.test?.questions?.length || 0) > 0) detectedType = 'test';
            else if (updatedLesson.content.video?.url || updatedLesson.content.video?.urlTj) detectedType = 'video';
            else if ((updatedLesson.content.slidesRu?.length || 0) > 0 || (updatedLesson.content.slidesTj?.length || 0) > 0) detectedType = 'presentation';

            const lessonToSave = { ...updatedLesson, type: detectedType };

            // 2. Сохраняем контент в Supabase
            await syllabusService.saveLesson(lessonToSave, selectedSubject);
            // Сбрасываем кеш структуры, чтобы обновлённый урок был виден на страницах навигации
            invalidateSyllabusCache(selectedSubject);

            // 2. Обновляем локальный стейт (это также запустит авто-сохранение структуры, если поменялось название)
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
                                    lessons: top.lessons.map(les => les.id === updatedLesson.id ? lessonToSave : les)
                                } : top
                            )
                        } : sec
                    )
                }
            }));

            // 3. Закрываем редактор только после успеха
            setEditingLesson(null);
            setEditingLessonContext(null);
        } catch (error) {
            console.error('Ошибка сохранения урока:', error);
            alert(t('creator.errorSaveLesson'));
        } finally {
            setIsLessonSaving(false);
        }
    };

    // АВТО-ПЕРЕВОД
    const [translating, setTranslating] = useState({ section: false, topic: false, lesson: false });

    const handleAutoTranslateSectionRuToTj = async () => {
        setTranslating(prev => ({ ...prev, section: true }));
        try {
            const translated = await translationService.translateText(newSectionTitleRu, 'ru', 'tj');
            setNewSectionTitleTj(translated);
        } finally {
            setTranslating(prev => ({ ...prev, section: false }));
        }
    };

    const handleAutoTranslateTopicRuToTj = async () => {
        setTranslating(prev => ({ ...prev, topic: true }));
        try {
            const translated = await translationService.translateText(newTopicTitleRu, 'ru', 'tj');
            setNewTopicTitleTj(translated);
        } finally {
            setTranslating(prev => ({ ...prev, topic: false }));
        }
    };

    const handleAutoTranslateLessonRuToTj = async () => {
        setTranslating(prev => ({ ...prev, lesson: true }));
        try {
            const translated = await translationService.translateText(newLessonTitleRu, 'ru', 'tj');
            setNewLessonTitleTj(translated);
        } finally {
            setTranslating(prev => ({ ...prev, lesson: false }));
        }
    };

    const handleAutoTranslateSectionTjToRu = async () => {
        setTranslating(prev => ({ ...prev, section: true }));
        try {
            const translated = await translationService.translateText(newSectionTitleTj, 'tj', 'ru');
            setNewSectionTitleRu(translated);
        } finally {
            setTranslating(prev => ({ ...prev, section: false }));
        }
    };

    const handleAutoTranslateTopicTjToRu = async () => {
        setTranslating(prev => ({ ...prev, topic: true }));
        try {
            const translated = await translationService.translateText(newTopicTitleTj, 'tj', 'ru');
            setNewTopicTitleRu(translated);
        } finally {
            setTranslating(prev => ({ ...prev, topic: false }));
        }
    };

    const handleAutoTranslateLessonTjToRu = async () => {
        setTranslating(prev => ({ ...prev, lesson: true }));
        try {
            const translated = await translationService.translateText(newLessonTitleTj, 'tj', 'ru');
            setNewLessonTitleRu(translated);
        } finally {
            setTranslating(prev => ({ ...prev, lesson: false }));
        }
    };

    const renderDualInput = (valueRu, setValueRu, valueTj, setValueTj, onAutoTranslateRuToTj, onAutoTranslateTjToRu, placeholderRu = t('creator.nameRu'), placeholderTj = t('creator.nameTj')) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <input type="text" value={valueRu} onChange={(e) => setValueRu(e.target.value)} placeholder={placeholderRu}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-primary/50 transition-colors" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">RU</span>
                </div>
                <button type="button" onClick={onAutoTranslateTjToRu} className="flex items-center gap-1 px-3 py-3 bg-gaming-primary/20 text-gaming-primary rounded-xl hover:bg-gaming-primary/30 transition-colors text-sm" title={t('creator.translateTjToRu')}>
                    <Sparkles size={16} className="rotate-180" />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <input type="text" value={valueTj} onChange={(e) => setValueTj(e.target.value)} placeholder={placeholderTj}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-accent/50 transition-colors" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">TJ</span>
                </div>
                <button type="button" onClick={onAutoTranslateRuToTj} className="flex items-center gap-1 px-3 py-3 bg-gaming-accent/20 text-gaming-accent rounded-xl hover:bg-gaming-accent/30 transition-colors text-sm" title={t('creator.translateRuToTj')}>
                    <Sparkles size={16} />
                </button>
            </div>
        </div>
    );

    const getLessonIcon = useCallback((type) => {
        const found = LESSON_TYPES.find(lt => lt.id === type);
        return found ? found.icon : FileText;
    }, []);

    // Получить все темы для модального окна перемещения
    const getAllTopics = () => currentSubjectSyllabus.sections.flatMap(s => s.topics.map(t => ({ ...t, sectionTitle: s.title })));

    return (
        <div className="min-h-screen bg-gaming-bg font-sans text-white p-3 sm:p-6">
            {/* Шапка */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gaming-textMuted hover:text-white transition-colors self-start">
                    <ChevronLeft size={20} />
                    {t('creator.back')}
                </button>

                {/* Индикатор синхронизации */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gaming-card/50 border border-white/5 text-sm font-medium">
                    {saveStatus === 'saved' && (
                        <>
                            <span className="text-gaming-accent">☁️</span>
                            <span className="text-gaming-textMuted">{t('creator.allSaved')}</span>
                        </>
                    )}
                    {saveStatus === 'saving' && (
                        <>
                            <Loader2 size={16} className="text-gaming-primary animate-spin" />
                            <span className="text-white">{t('creator.saving')}</span>
                        </>
                    )}
                    {saveStatus === 'error' && (
                        <>
                            <span className="text-red-500">❌</span>
                            <span className="text-red-400">{t('creator.saveError')}</span>
                        </>
                    )}
                </div>


            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
                <GraduationCap className="text-gaming-primary" size={32} />
                {t('creator.panelTitle')}
            </h1>
            <p className="text-gaming-textMuted text-base sm:text-lg mb-6 sm:mb-8">
                {t('creator.panelSubtitle')}
            </p>

            {/* Селектор предмета */}
            <div className="mb-6 sm:mb-8">
                <label className="block text-sm text-gaming-textMuted mb-2">{t('creator.selectSubject')}</label>
                <div className="relative">
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full sm:max-w-md bg-gaming-card/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-gaming-primary/50 transition-colors">
                        {ALL_SUBJECTS_LIST.map(subjectId => (
                            <option key={subjectId} value={subjectId} className="bg-gaming-card text-white">{SUBJECT_NAMES[subjectId]?.[lang] || subjectId}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gaming-textMuted pointer-events-none" size={20} />
                </div>
            </div>

            {/* Область контента */}
            <div className="bg-gaming-card/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="text-gaming-primary" size={24} />
                        {t('creator.sections')}
                    </h2>
                    <button onClick={() => setShowAddSection(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-gaming-primary/20 text-gaming-primary rounded-xl hover:bg-gaming-primary/30 transition-colors active:scale-95 w-full sm:w-auto">
                        <FolderPlus size={18} />
                        {t('creator.addSection')}
                    </button>
                </div>

                {/* Форма добавления раздела */}
                {showAddSection && (
                    <div className="mb-6 p-4 bg-gaming-bg/50 rounded-2xl border border-gaming-primary/30">
                        <h3 className="text-lg font-semibold mb-4 text-gaming-primary">{t('creator.newSection')}</h3>
                        {renderDualInput(newSectionTitleRu, setNewSectionTitleRu, newSectionTitleTj, setNewSectionTitleTj, handleAutoTranslateSectionRuToTj, handleAutoTranslateSectionTjToRu)}
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleAddSection} className="flex items-center gap-2 px-4 py-2 bg-gaming-primary text-white rounded-xl hover:bg-gaming-primary/80 transition-colors active:scale-95">
                                <Save size={16} />{t('creator.save')}
                            </button>
                            <button onClick={() => { setShowAddSection(false); setNewSectionTitleRu(''); setNewSectionTitleTj(''); }} className="px-4 py-2 text-gaming-textMuted hover:text-white transition-colors">
                                {t('creator.cancel')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Список разделов с Drag-and-Drop */}
                {currentSubjectSyllabus.sections.length === 0 ? (
                    <div className="text-center py-12 text-gaming-textMuted">
                        <Book size={48} className="mx-auto mb-4 opacity-30" />
                        <p>{t('creator.noSections')}</p>
                    </div>
                ) : (
                    /* DND CONTEXT - SIMPLE SORTING ONLY */
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={currentSubjectSyllabus.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {currentSubjectSyllabus.sections.map((section, sectionIndex) => (
                                    <SortableSection key={section.id} section={section} sectionIndex={sectionIndex} lang={lang} onDelete={handleDeleteSection}>
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/row gap-2 sm:gap-2">
                                                <div className="flex-1 flex items-start sm:items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => toggleSection(section.id)}>
                                                    <div className="mt-1 sm:mt-0 shrink-0">
                                                        {expandedSections[section.id] ? <ChevronDown size={20} className="text-gaming-primary" /> : <ChevronRight size={20} className="text-gaming-textMuted" />}
                                                    </div>
                                                    <span className="text-base sm:text-lg font-semibold break-words leading-tight flex-1">
                                                        {sectionIndex + 1}. {lang === 'tj' ? (section.titleTj || section.title) : section.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end w-full sm:w-auto gap-2 shrink-0 border-t border-white/5 sm:border-none pt-2 sm:pt-0 mt-2 sm:mt-0 text-xs sm:text-sm text-gaming-textMuted">
                                                    <span className="mr-2">({section.topics?.length || 0} {t('creator.themes')})</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRenameModal({
                                                                type: 'section',
                                                                id: section.id,
                                                                titleRu: section.title,
                                                                titleTj: section.titleTj || ''
                                                            });
                                                        }}
                                                        className="p-1.5 sm:p-2 text-gaming-textMuted hover:text-gaming-accent sm:opacity-0 group-hover/row:opacity-100 transition-colors bg-gaming-bg/50 sm:bg-transparent rounded-lg"
                                                        title={t('creator.editTitle')}
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} className="p-1.5 sm:p-2 text-gaming-textMuted hover:text-red-400 transition-colors bg-gaming-bg/50 sm:bg-transparent rounded-lg">
                                                        <Trash2 size={16} sm:size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedSections[section.id] && (
                                                <div className="mt-3 sm:mt-4 ml-3 sm:ml-8 pl-3 sm:pl-0 border-l border-white/5 sm:border-none">
                                                    <button onClick={() => setShowAddTopic(section.id)} className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 mb-4 text-sm bg-gaming-accent/5 sm:bg-transparent text-gaming-accent hover:bg-gaming-accent/10 rounded-xl sm:rounded-lg transition-colors w-full sm:w-auto mt-2 sm:mt-0">
                                                        <Plus size={16} />{t('creator.addTopic')}
                                                    </button>

                                                    {showAddTopic === section.id && (
                                                        <div className="mb-4 p-4 bg-gaming-card/50 rounded-xl border border-gaming-accent/30">
                                                            <h4 className="text-md font-semibold mb-3 text-gaming-accent">{t('creator.newTopic')}</h4>
                                                            {renderDualInput(newTopicTitleRu, setNewTopicTitleRu, newTopicTitleTj, setNewTopicTitleTj, handleAutoTranslateTopicRuToTj, handleAutoTranslateTopicTjToRu)}
                                                            <div className="flex gap-3 mt-4">
                                                                <button onClick={() => handleAddTopic(section.id)} className="flex items-center gap-2 px-3 py-2 bg-gaming-accent text-white rounded-lg hover:bg-gaming-accent/80 transition-colors active:scale-95 text-sm">
                                                                    <Save size={14} />{t('creator.save')}
                                                                </button>
                                                                <button onClick={() => { setShowAddTopic(null); setNewTopicTitleRu(''); setNewTopicTitleTj(''); }} className="px-3 py-2 text-gaming-textMuted hover:text-white transition-colors text-sm">
                                                                    {t('creator.cancel')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {section.topics?.length === 0 ? (
                                                        <p className="text-sm text-gaming-textMuted">{t('creator.noTopics')}</p>
                                                    ) : (
                                                        <SortableContext items={section.topics.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                                            <div className="space-y-3">
                                                                {section.topics.map((topic, topicIndex) => (
                                                                    <SortableTopic key={topic.id} topic={topic} topicIndex={topicIndex} sectionIndex={sectionIndex}>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/row gap-2">
                                                                                <div className="flex-1 flex items-start sm:items-center gap-2 cursor-pointer min-w-0" onClick={() => toggleTopic(topic.id)}>
                                                                                    <div className="mt-0.5 sm:mt-0 shrink-0">
                                                                                        {expandedTopics[topic.id] ? <ChevronDown size={16} className="text-gaming-accent" /> : <ChevronRight size={16} className="text-gaming-textMuted" />}
                                                                                    </div>
                                                                                    <span className="font-medium text-sm sm:text-base break-words line-clamp-2 leading-tight flex-1">
                                                                                        {sectionIndex + 1}.{topicIndex + 1}. {lang === 'tj' ? (topic.titleTj || topic.title) : topic.title}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center justify-end w-full sm:w-auto gap-2 shrink-0 border-t border-white/5 sm:border-none pt-2 sm:pt-0 mt-1 sm:mt-0">
                                                                                    <span className="text-xs text-gaming-textMuted mr-1 sm:mr-2">({topic.lessons?.length || 0} {t('creator.lessons')})</span>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setRenameModal({
                                                                                                type: 'topic',
                                                                                                id: topic.id,
                                                                                                sectionId: section.id,
                                                                                                titleRu: topic.title,
                                                                                                titleTj: topic.titleTj || ''
                                                                                            });
                                                                                        }}
                                                                                        className="p-1 sm:p-1.5 text-gaming-textMuted hover:text-gaming-accent sm:opacity-0 group-hover/row:opacity-100 transition-colors bg-gaming-bg/50 sm:bg-transparent rounded"
                                                                                        title={t('creator.editTitle')}
                                                                                    >
                                                                                        <Edit3 size={14} />
                                                                                    </button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); setMoveModal({ type: 'topic', id: topic.id, fromSectionId: section.id }); }} className="p-1 sm:p-1.5 text-gaming-textMuted hover:text-gaming-accent transition-colors bg-gaming-bg/50 sm:bg-transparent rounded" title={t('creator.move')}>
                                                                                        <ArrowRightLeft size={14} />
                                                                                    </button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(section.id, topic.id); }} className="p-1 sm:p-1.5 text-gaming-textMuted hover:text-red-400 transition-colors bg-gaming-bg/50 sm:bg-transparent rounded">
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {expandedTopics[topic.id] && (
                                                                                <div className="mt-2 sm:mt-3 ml-2 sm:ml-6 pl-2 sm:pl-0 border-l border-white/5 sm:border-none">
                                                                                    <button onClick={() => setShowAddLesson({ sectionId: section.id, topicId: topic.id })} className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 mb-3 text-sm bg-gaming-pink/5 sm:bg-transparent text-gaming-pink hover:bg-gaming-pink/10 rounded-xl sm:rounded-lg transition-colors w-full sm:w-auto mt-2 sm:mt-0">
                                                                                        <Plus size={14} />{t('creator.addLesson')}
                                                                                    </button>

                                                                                    {showAddLesson?.sectionId === section.id && showAddLesson?.topicId === topic.id && (
                                                                                        <div className="mb-3 p-3 bg-gaming-bg/50 rounded-lg border border-gaming-pink/30">
                                                                                            <h5 className="text-sm font-semibold mb-3 text-gaming-pink">{t('creator.newLesson')}</h5>
                                                                                            {renderDualInput(newLessonTitleRu, setNewLessonTitleRu, newLessonTitleTj, setNewLessonTitleTj, handleAutoTranslateLessonRuToTj, handleAutoTranslateLessonTjToRu)}
                                                                                            <div className="flex gap-2 mt-4">
                                                                                                <button onClick={() => handleAddLesson(section.id, topic.id)} className="flex items-center gap-2 px-3 py-2 bg-gaming-pink text-white rounded-lg hover:bg-gaming-pink/80 transition-colors active:scale-95 text-xs">
                                                                                                    <Save size={12} />{t('creator.save')}
                                                                                                </button>
                                                                                                <button onClick={() => { setShowAddLesson(null); setNewLessonTitleRu(''); setNewLessonTitleTj(''); }} className="px-3 py-2 text-gaming-textMuted hover:text-white transition-colors text-xs">
                                                                                                    {t('creator.cancel')}
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {topic.lessons?.length === 0 ? (
                                                                                        <p className="text-xs text-gaming-textMuted">{t('creator.noLessons')}</p>
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
                                                                                                            } else if (action === 'rename') {
                                                                                                                setRenameModal({
                                                                                                                    type: 'lesson',
                                                                                                                    id: lesson.id,
                                                                                                                    sectionId: section.id,
                                                                                                                    topicId: topic.id,
                                                                                                                    titleRu: lesson.title,
                                                                                                                    titleTj: lesson.titleTj || ''
                                                                                                                });
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
                    onAutoSave={handleAutoSaveLesson}
                    autoSaveStatus={autoSaveStatus}
                    onClose={() => { if (!isLessonSaving) { setEditingLesson(null); setEditingLessonContext(null); } }}
                    lang={lang}
                    isSaving={isLessonSaving}
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
            )}

            {/* Модальное окно переименования */}
            {renameModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-gaming-card/95 backdrop-blur-xl rounded-2xl border border-gaming-primary/30 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Edit3 className="text-gaming-primary" size={24} />
                            {t('creator.editTitle')}
                        </h3>

                        {renderDualInput(
                            renameModal.titleRu,
                            (val) => setRenameModal(prev => ({ ...prev, titleRu: val })),
                            renameModal.titleTj,
                            (val) => setRenameModal(prev => ({ ...prev, titleTj: val })),
                            async () => {
                                const translated = await translateText(renameModal.titleRu, 'ru', 'tj');
                                setRenameModal(prev => ({ ...prev, titleTj: translated }));
                            },
                            async () => {
                                const translated = await translateText(renameModal.titleTj, 'tj', 'ru');
                                setRenameModal(prev => ({ ...prev, titleRu: translated }));
                            }
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => handleRename(renameModal)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gaming-primary text-white rounded-xl hover:bg-gaming-primary/80 transition-colors font-medium shadow-lg shadow-gaming-primary/20"
                            >
                                <Save size={18} />
                                {t('creator.save')}
                            </button>
                            <button
                                onClick={() => setRenameModal(null)}
                                className="px-4 py-3 bg-white/5 text-gaming-textMuted hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                            >
                                {t('creator.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default function WrappedCreatorPage(props) {
    return (
        <ComponentErrorBoundary>
            <CreatorPage {...props} />
        </ComponentErrorBoundary>
    );
}
