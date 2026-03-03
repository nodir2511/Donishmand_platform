import { supabase } from './supabase';
import { syllabusService } from './syllabusService';

/**
 * Сервис для кабинета ученика.
 * Загрузка истории тестов, прогресса по предметам, смена пароля и аватара.
 */
export const studentService = {

    /**
     * Получить историю тестирования ученика.
     * НЕ возвращает содержание вопросов (answers_detail) — это безопасность.
     *
     * @param {object} filters - { period: 'week'|'month'|'all', subjectId: string|null }
     * @returns {Promise<Array>} Массив попыток
     */
    async getMyTestHistory(filters = {}) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');

        // Базовый запрос — БЕЗ answers_detail (безопасность!)
        let query = supabase
            .from('user_test_results')
            .select('id, lesson_id, score, correct_count, total_questions, is_passed, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // Фильтр по периоду
        if (filters.period && filters.period !== 'all') {
            const now = new Date();
            let startDate;
            if (filters.period === 'week') {
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (filters.period === 'month') {
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Получаем названия уроков
        const lessonIds = [...new Set(data.map(r => r.lesson_id))];
        const lessonNames = await this._getLessonNames(lessonIds);

        // Обогащаем результаты названиями
        const results = data.map(r => ({
            ...r,
            lessonName: lessonNames[r.lesson_id] || 'Тест',
            errorCount: r.total_questions - r.correct_count,
        }));

        // Фильтр по предмету (через lesson_id → subject mapping)
        if (filters.subjectId) {
            const subjectLessonIds = await this._getSubjectLessonIds(filters.subjectId);
            return results.filter(r => subjectLessonIds.has(r.lesson_id));
        }

        return results;
    },

    /**
     * Получить сводку прогресса по предметам.
     * @param {string[]} selectedSubjects - Массив ID предметов ученика
     * @returns {Promise<Object>} { subjects: [...], summary: {...} }
     */
    async getMyProgressSummary(selectedSubjects = []) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');

        // Параллельно загружаем прогресс уроков и результаты тестов
        const [progressRes, testRes] = await Promise.all([
            supabase
                .from('user_lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id),
            supabase
                .from('user_test_results')
                .select('lesson_id, score')
                .eq('user_id', user.id),
        ]);

        const completedLessons = new Set();
        if (progressRes.data) progressRes.data.forEach(p => completedLessons.add(p.lesson_id));
        if (testRes.data) testRes.data.forEach(t => completedLessons.add(t.lesson_id));

        // Считаем средние баллы по lesson_id
        const scoresByLesson = {};
        if (testRes.data) {
            testRes.data.forEach(t => {
                if (!scoresByLesson[t.lesson_id]) scoresByLesson[t.lesson_id] = [];
                scoresByLesson[t.lesson_id].push(t.score);
            });
        }

        // Загружаем структуры предметов для подсчёта
        const subjectStats = [];
        let totalLessonsAll = 0;
        let completedLessonsAll = 0;
        let allScores = [];

        for (const subjectId of selectedSubjects) {
            try {
                const structure = await syllabusService.getStructure(subjectId);
                if (!structure?.sections) continue;

                let totalLessons = 0;
                let completed = 0;
                const subjectScores = [];

                for (const section of structure.sections) {
                    if (!section.topics) continue;
                    for (const topic of section.topics) {
                        if (!topic.lessons) continue;
                        for (const lesson of topic.lessons) {
                            totalLessons++;
                            if (completedLessons.has(lesson.id)) {
                                completed++;
                            }
                            if (scoresByLesson[lesson.id]) {
                                subjectScores.push(...scoresByLesson[lesson.id]);
                            }
                        }
                    }
                }

                const avgScore = subjectScores.length > 0
                    ? Math.round(subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length)
                    : null;

                totalLessonsAll += totalLessons;
                completedLessonsAll += completed;
                allScores.push(...subjectScores);

                subjectStats.push({
                    subjectId,
                    totalLessons,
                    completedLessons: completed,
                    progress: totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0,
                    avgScore,
                    testsCount: subjectScores.length,
                });
            } catch {
                // Предмет без контента — пропускаем
            }
        }

        // Общая сводка
        const totalTests = testRes.data?.length || 0;
        const avgScoreAll = allScores.length > 0
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            : 0;
        const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;

        return {
            subjects: subjectStats,
            summary: {
                totalTests,
                avgScore: avgScoreAll,
                bestScore,
                completedLessons: completedLessonsAll,
                totalLessons: totalLessonsAll,
            },
        };
    },

    /**
     * Сменить пароль текущего пользователя.
     * @param {string} newPassword - Новый пароль
     */
    async changePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    },

    /**
     * Обновить аватар пользователя.
     * @param {string} avatarUrl - Путь к выбранному аватару
     */
    async updateAvatar(avatarUrl) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (error) throw error;
    },

    // === Вспомогательные методы ===

    /**
     * Получить названия уроков по массиву ID (из таблицы lessons).
     * @param {string[]} lessonIds
     * @returns {Promise<Object>} Словарь { lessonId: название }
     */
    async _getLessonNames(lessonIds) {
        if (!lessonIds.length) return {};

        const { data, error } = await supabase
            .from('lessons')
            .select('id, title_ru, title_tj')
            .in('id', lessonIds);

        if (error || !data) return {};

        const names = {};
        data.forEach(lesson => {
            // Название хранится в колонках title_ru / title_tj (не в content_ru)
            names[lesson.id] = lesson.title_ru || lesson.title_tj || lesson.id;
        });
        return names;
    },

    /**
     * Получить Set<lesson_id> для конкретного предмета (из структуры syllabus).
     * @param {string} subjectId
     * @returns {Promise<Set<string>>}
     */
    async _getSubjectLessonIds(subjectId) {
        const ids = new Set();
        try {
            const structure = await syllabusService.getStructure(subjectId);
            if (structure?.sections) {
                for (const section of structure.sections) {
                    if (!section.topics) continue;
                    for (const topic of section.topics) {
                        if (!topic.lessons) continue;
                        for (const lesson of topic.lessons) {
                            ids.add(lesson.id);
                        }
                    }
                }
            }
        } catch { /* пропускаем */ }
        return ids;
    },
};
