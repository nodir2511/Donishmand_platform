import { supabase } from './supabase';

/**
 * Сервис для синхронизации структуры курса (Syllabus) и контента уроков.
 * Стратегия: "Не мусорить в БД".
 * - Структура (Разделы -> Темы -> ID уроков) сохраняется как ОДИН JSON объект для каждого предмета.
 * - Контент уроков сохраняется в таблицу 'lessons' (одна строка на урок).
 */

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
     * Сохранить контент конкретного урока (Текст, Видео и т.д.).
     * @param {object} lesson - Полный объект урока
     * @param {string} subject - ID предмета
     */
    async saveLesson(lesson, subject) {
        const { error } = await supabase
            .from('lessons')
            .upsert({
                id: lesson.id, // Используем тот же ID (les_xxx) благодаря типу TEXT в БД
                title_ru: lesson.title,
                title_tj: lesson.titleTj,
                subject: subject,
                content_ru: lesson.content, // Сохраняем весь контент как JSON
                is_published: true,
                updated_at: new Date()
            }, { onConflict: 'id' });

        if (error) throw error;
        return true;
    },

    /**
     * Получить контент урока по ID.
     * @param {string} lessonId
     */
    async getLesson(lessonId) {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();

        if (error) {
            // Если урок не найден в базе, это норм (он может быть пока только локально или в структуре)
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        // Преобразуем формат из БД обратно в удобный для фронта
        // В БД: { content_ru: {...}, ... }
        // На фронте мы ожидаем: { ...lesson, content: ... }
        return {
            id: data.id,
            title: data.title_ru, // Основной заголовок у нас RU
            titleTj: data.title_tj,
            content: data.content_ru, // Берем контент (пока только RU ветку как основную)
            subject: data.subject,    // <--- ДОБАВИЛИ ЭТО (нужно для контекста навигации)
            // Если нужно будет разделять контент RU/TJ явно, расширим здесь
        };
    }
};
