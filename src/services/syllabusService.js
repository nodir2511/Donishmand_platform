import { supabase } from './supabase';

/**
 * Сервис для синхронизации структуры курса (Syllabus) и контента уроков.
 * Стратегия: "Не мусорить в БД".
 * - Структура (Разделы -> Темы -> ID уроков) сохраняется как ОДИН JSON объект для каждого предмета.
 * - Контент уроков сохраняется в таблицу 'lessons' (одна строка на урок).
 * - Контент разделён на две колонки: content_ru и content_tj.
 */

/**
 * Разбить единый объект контента на два языковых объекта.
 * Редакторы работают с объединённым форматом (textRu/textTj, bodyRu/bodyTj и т.д.),
 * а эта функция разделяет его для сохранения в отдельные колонки БД.
 * @param {object} content - Единый объект контента из редактора
 * @returns {{ contentRu: object, contentTj: object }}
 */
const splitContent = (content) => {
    if (!content) return { contentRu: null, contentTj: null };

    // Разделяем вопросы теста по языкам
    const splitQuestions = (questions) => {
        if (!questions || !Array.isArray(questions)) return { ru: [], tj: [] };

        const ru = questions.map(q => {
            const base = { id: q.id, type: q.type, image: q.image };
            base.text = q.textRu || '';
            if (q.type === 'multiple_choice') {
                base.options = (q.options || []).map(opt => ({
                    id: opt.id, text: opt.textRu || '', image: opt.image
                }));
                base.correctId = q.correctId;
            } else if (q.type === 'matching') {
                base.leftItems = (q.leftItems || []).map(item => ({
                    id: item.id, text: item.textRu || '', image: item.image
                }));
                base.rightItems = (q.rightItems || []).map(item => ({
                    id: item.id, text: item.textRu || '', image: item.image
                }));
                base.correctMatches = q.correctMatches;
            } else if (q.type === 'numeric') {
                base.digits = q.digits;
                base.unit = q.unit;
            }
            return base;
        });

        const tj = questions.map(q => {
            const base = { id: q.id, type: q.type, image: q.image };
            base.text = q.textTj || '';
            if (q.type === 'multiple_choice') {
                base.options = (q.options || []).map(opt => ({
                    id: opt.id, text: opt.textTj || '', image: opt.image
                }));
                base.correctId = q.correctId;
            } else if (q.type === 'matching') {
                base.leftItems = (q.leftItems || []).map(item => ({
                    id: item.id, text: item.textTj || '', image: item.image
                }));
                base.rightItems = (q.rightItems || []).map(item => ({
                    id: item.id, text: item.textTj || '', image: item.image
                }));
                base.correctMatches = q.correctMatches;
            } else if (q.type === 'numeric') {
                base.digits = q.digits;
                base.unit = q.unit;
            }
            return base;
        });

        return { ru, tj };
    };

    const { ru: questionsRu, tj: questionsTj } = splitQuestions(content.test?.questions);

    return {
        contentRu: {
            video: {
                url: content.video?.url || '',
                description: content.video?.descriptionRu || ''
            },
            text: { body: content.text?.bodyRu || '' },
            test: { questions: questionsRu },
            slides: content.slidesRu || []
        },
        contentTj: {
            video: {
                url: content.video?.urlTj || '',
                description: content.video?.descriptionTj || ''
            },
            text: { body: content.text?.bodyTj || '' },
            test: { questions: questionsTj },
            slides: content.slidesTj || []
        }
    };
};

/**
 * Объединить два языковых объекта обратно в единый формат для редакторов.
 * @param {object} contentRu - RU контент из БД
 * @param {object} contentTj - TJ контент из БД
 * @returns {object} - Единый объект контента для редакторов и LessonPage
 */
const mergeContent = (contentRu, contentTj) => {
    // Обратная совместимость: если content_ru содержит старый объединённый формат
    // (bodyRu, descriptionRu, slidesRu), возвращаем его напрямую
    if (contentRu && (contentRu.slidesRu || contentRu.text?.bodyRu)) {
        return contentRu;
    }

    const ru = contentRu || {};
    const tj = contentTj || {};

    // Объединяем вопросы теста обратно в двуязычный формат
    const mergeQuestions = (ruQuestions, tjQuestions) => {
        const ruQ = ruQuestions || [];
        const tjQ = tjQuestions || [];
        // Берём RU как основу (там все ID и структура), добавляем TJ тексты
        return ruQ.map((rq, idx) => {
            const tq = tjQ[idx] || {};
            const merged = {
                id: rq.id, type: rq.type, image: rq.image,
                textRu: rq.text || '',
                textTj: tq.text || ''
            };
            if (rq.type === 'multiple_choice') {
                merged.options = (rq.options || []).map((opt, optIdx) => ({
                    id: opt.id, image: opt.image,
                    textRu: opt.text || '',
                    textTj: tq.options?.[optIdx]?.text || ''
                }));
                merged.correctId = rq.correctId;
            } else if (rq.type === 'matching') {
                merged.leftItems = (rq.leftItems || []).map((item, i) => ({
                    id: item.id, image: item.image,
                    textRu: item.text || '',
                    textTj: tq.leftItems?.[i]?.text || ''
                }));
                merged.rightItems = (rq.rightItems || []).map((item, i) => ({
                    id: item.id, image: item.image,
                    textRu: item.text || '',
                    textTj: tq.rightItems?.[i]?.text || ''
                }));
                merged.correctMatches = rq.correctMatches;
            } else if (rq.type === 'numeric') {
                merged.digits = rq.digits;
                merged.unit = rq.unit;
            }
            return merged;
        });
    };

    return {
        video: {
            url: ru.video?.url || '',
            urlTj: tj.video?.url || '',
            descriptionRu: ru.video?.description || '',
            descriptionTj: tj.video?.description || ''
        },
        text: {
            bodyRu: ru.text?.body || '',
            bodyTj: tj.text?.body || ''
        },
        test: {
            questions: mergeQuestions(ru.test?.questions, tj.test?.questions)
        },
        slidesRu: ru.slides || [],
        slidesTj: tj.slides || []
    };
};

export const syllabusService = {

    /**
     * Сохранить всю структуру предмета (Разделы -> Темы -> Списки уроков).
     * @param {string} subject - ID предмета (например, 'math')
     * @param {object} syllabusData - Полный объект структуры для этого предмета
     */
    async saveStructure(subject, syllabusData) {
        // Очищаем данные от тяжелого контента, оставляем только IDs и Заголовки.
        // Это позволяет сохранить JSON легким и обновлять только структуру.
        const cleanSections = syllabusData.sections.map(section => ({
            id: section.id,
            title: section.title,
            titleTj: section.titleTj,
            topics: section.topics.map(topic => ({
                id: topic.id,
                title: topic.title,
                titleTj: topic.titleTj,
                lessons: topic.lessons.map(lesson => ({
                    id: lesson.id,
                    title: lesson.title,
                    titleTj: lesson.titleTj,
                    type: lesson.type
                    // Мы НЕ сохраняем поле 'content' здесь. Оно живет в таблице 'lessons'.
                }))
            }))
        }));

        const { error } = await supabase
            .from('subject_syllabus')
            .upsert({
                subject: subject,
                data: { sections: cleanSections },
                updated_at: new Date()
            }, { onConflict: 'subject' });

        if (error) {
            console.error('Ошибка сохранения структуры:', error);
            throw error;
        }
        return true;
    },

    /**
     * Получить структуру предмета.
     * @param {string} subject - ID предмета
     */
    async getStructure(subject) {
        const { data, error } = await supabase
            .from('subject_syllabus')
            .select('data')
            .eq('subject', subject)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Запись не найдена (пусто)
            throw error;
        }
        return data.data; // Возвращает { sections: [...] }
    },

    /**
     * Сохранить контент конкретного урока.
     * Контент автоматически разделяется на content_ru и content_tj.
     * @param {object} lesson - Полный объект урока (с единым content)
     * @param {string} subject - ID предмета
     */
    async saveLesson(lesson, subject) {
        const { contentRu, contentTj } = splitContent(lesson.content);

        const { error } = await supabase
            .from('lessons')
            .upsert({
                id: lesson.id,
                title_ru: lesson.title,
                title_tj: lesson.titleTj,
                subject: subject,
                content_ru: contentRu,
                content_tj: contentTj,
                is_published: true,
                updated_at: new Date()
            }, { onConflict: 'id' });

        if (error) throw error;
        return true;
    },

    /**
     * Получить контент урока по ID.
     * @param {string} lessonId
     * @param {string|null} lang - Язык контента ('ru', 'tj'). Если null — загружает оба (для редактора).
     */
    async getLesson(lessonId, lang = null) {
        // Оптимизация: загружаем только нужную колонку контента
        const columns = lang === 'ru'
            ? 'id, title_ru, title_tj, subject, content_ru'
            : lang === 'tj'
                ? 'id, title_ru, title_tj, subject, content_tj'
                : '*';

        const { data, error } = await supabase
            .from('lessons')
            .select(columns)
            .eq('id', lessonId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        let content;
        if (lang) {
            // Режим просмотра: один язык → обернуть в единый формат
            const langContent = lang === 'ru' ? data.content_ru : data.content_tj;
            // Обратная совместимость: старый формат уже содержит оба языка
            if (langContent && (langContent.slidesRu || langContent.text?.bodyRu)) {
                content = langContent;
            } else {
                content = wrapSingleLangContent(langContent, lang);
            }
        } else {
            // Режим редактора: оба языка → объединить
            content = mergeContent(data.content_ru, data.content_tj);
        }

        return {
            id: data.id,
            title: data.title_ru,
            titleTj: data.title_tj,
            content: content,
            subject: data.subject,
        };
    }
};

/**
 * Обернуть одноязычный контент из БД в единый формат для фронта.
 * Помещает данные в правильные языковые поля, оставляя другой язык пустым.
 * @param {object} content - Контент одного языка (новый формат из БД)
 * @param {string} lang - 'ru' или 'tj'
 * @returns {object} - Единый объект контента
 */
const wrapSingleLangContent = (content, lang) => {
    if (!content) {
        return {
            video: { url: '', urlTj: '', descriptionRu: '', descriptionTj: '' },
            text: { bodyRu: '', bodyTj: '' },
            test: { questions: [] },
            slidesRu: [],
            slidesTj: []
        };
    }

    const isRu = lang === 'ru';

    // Конвертируем вопросы из одноязычного формата (text) в двуязычный (textRu/textTj)
    const wrapQuestions = (questions) => {
        return (questions || []).map(q => {
            const wrapped = {
                id: q.id, type: q.type, image: q.image,
                textRu: isRu ? (q.text || '') : '',
                textTj: isRu ? '' : (q.text || '')
            };
            if (q.type === 'multiple_choice') {
                wrapped.options = (q.options || []).map(opt => ({
                    id: opt.id, image: opt.image,
                    textRu: isRu ? (opt.text || '') : '',
                    textTj: isRu ? '' : (opt.text || '')
                }));
                wrapped.correctId = q.correctId;
            } else if (q.type === 'matching') {
                wrapped.leftItems = (q.leftItems || []).map(item => ({
                    id: item.id, image: item.image,
                    textRu: isRu ? (item.text || '') : '',
                    textTj: isRu ? '' : (item.text || '')
                }));
                wrapped.rightItems = (q.rightItems || []).map(item => ({
                    id: item.id, image: item.image,
                    textRu: isRu ? (item.text || '') : '',
                    textTj: isRu ? '' : (item.text || '')
                }));
                wrapped.correctMatches = q.correctMatches;
            } else if (q.type === 'numeric') {
                wrapped.digits = q.digits;
                wrapped.unit = q.unit;
            }
            return wrapped;
        });
    };

    return {
        video: {
            url: isRu ? (content.video?.url || '') : '',
            urlTj: isRu ? '' : (content.video?.url || ''),
            descriptionRu: isRu ? (content.video?.description || '') : '',
            descriptionTj: isRu ? '' : (content.video?.description || '')
        },
        text: {
            bodyRu: isRu ? (content.text?.body || '') : '',
            bodyTj: isRu ? '' : (content.text?.body || '')
        },
        test: { questions: wrapQuestions(content.test?.questions) },
        slidesRu: isRu ? (content.slides || []) : [],
        slidesTj: isRu ? [] : (content.slides || [])
    };
};

