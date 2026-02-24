import { supabase } from './supabase';

/**
 * Утилита: получить список ID студентов класса.
 * Возвращает { students: string[], members: object[] }
 */
const getClassStudents = async (classId) => {
    const { data: members, error } = await supabase
        .from('class_members')
        .select(`
            student_id,
            profile:profiles!class_members_student_id_fkey (id, full_name, avatar_url, role)
        `)
        .eq('class_id', classId);

    if (error) {
        console.error('Ошибка получения списка учеников:', error);
        return { students: [], members: [] };
    }

    const filtered = members.filter(m => m.profile?.role === 'student' || !m.profile?.role);
    return {
        students: filtered.map(m => m.student_id),
        members: filtered
    };
};

/**
 * Утилита: получить дату начала для фильтра по периоду.
 * @param {'week' | 'month' | 'all'} period
 * @returns {string | null} ISO дата или null (для всего периода)
 */
const getPeriodStartDate = (period) => {
    if (period === 'all' || !period) return null;
    const now = new Date();
    if (period === 'week') {
        now.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        now.setMonth(now.getMonth() - 1);
    }
    return now.toISOString();
};

/**
 * Сервис для получения и агрегации статистики по классам и ученикам.
 */
export const statisticsService = {
    /**
     * Получить общую статистику по классу (сводка) с фильтрацией.
     * 
     * @param {string} classId - ID класса
     * @param {object} filters - { period: 'week'|'month'|'all', studentId: string|null }
     * @returns {Promise<Object>} Обобщенные данные класса
     */
    async getClassSummaryStats(classId, filters = {}) {
        const { period = 'all', studentId = null } = filters;
        const periodStart = getPeriodStartDate(period);

        const { students } = await getClassStudents(classId);
        if (students.length === 0) {
            return { studentsCount: 0, averageTestScore: 0, totalTestsTaken: 0, averageProgress: 0, testsBreakdown: [], passRate: 0 };
        }

        // Определяем целевых студентов (все или один конкретный)
        const targetStudents = studentId ? [studentId] : students;

        // Получить результаты тестов с фильтром по периоду
        let testQuery = supabase
            .from('user_test_results')
            .select('*')
            .in('user_id', targetStudents);
        if (periodStart) testQuery = testQuery.gte('created_at', periodStart);

        const { data: testResults, error: testsError } = await testQuery;
        if (testsError) {
            console.error('Ошибка получения результатов тестов:', testsError);
            return null;
        }

        // Получить прогресс уроков
        const { data: lessonProgress, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .in('user_id', targetStudents);
        if (progressError) console.error('Ошибка получения прогресса:', progressError);

        // Агрегация данных по урокам (тесты)
        let totalScore = 0;
        let passedCount = 0;
        const testsByLesson = {};

        (testResults || []).forEach(tr => {
            totalScore += tr.score || 0;
            if (tr.is_passed) passedCount++;

            if (!testsByLesson[tr.lesson_id]) {
                testsByLesson[tr.lesson_id] = { totalScore: 0, count: 0, fails: 0, lessonId: tr.lesson_id };
            }
            testsByLesson[tr.lesson_id].totalScore += tr.score || 0;
            testsByLesson[tr.lesson_id].count += 1;
            if (!tr.is_passed) testsByLesson[tr.lesson_id].fails += 1;
        });

        const testsLen = (testResults || []).length;
        const averageTestScore = testsLen > 0 ? (totalScore / testsLen).toFixed(1) : 0;
        const passRate = testsLen > 0 ? Math.round((passedCount / testsLen) * 100) : 0;

        const testsBreakdown = Object.keys(testsByLesson).map(lessonId => {
            const t = testsByLesson[lessonId];
            return {
                lessonId,
                averageScore: (t.totalScore / t.count).toFixed(1),
                failRate: ((t.fails / t.count) * 100).toFixed(1),
                attemptsCount: t.count
            };
        });
        // Худшие тесты сначала
        testsBreakdown.sort((a, b) => Number(a.averageScore) - Number(b.averageScore));

        return {
            studentsCount: studentId ? 1 : students.length,
            averageTestScore: Number(averageTestScore),
            totalTestsTaken: testsLen,
            passRate,
            lessonsOpened: (lessonProgress || []).length,
            testsBreakdown
        };
    },

    /**
     * Получить данные динамики успеваемости во времени (для LineChart).
     * Группирует результаты тестов по дням.
     *
     * @param {string} classId - ID класса
     * @param {object} filters - { period: 'week'|'month'|'all', studentId: string|null }
     * @returns {Promise<Array>} [{ date: 'ДД.ММ', avgScore: число, tests: число }, ...]
     */
    async getClassTimeDynamics(classId, filters = {}) {
        const { period = 'all', studentId = null } = filters;
        const periodStart = getPeriodStartDate(period);

        const { students } = await getClassStudents(classId);
        if (students.length === 0) return [];

        const targetStudents = studentId ? [studentId] : students;

        let query = supabase
            .from('user_test_results')
            .select('score, created_at, is_passed')
            .in('user_id', targetStudents)
            .order('created_at', { ascending: true });
        if (periodStart) query = query.gte('created_at', periodStart);

        const { data, error } = await query;
        if (error) {
            console.error('Ошибка загрузки динамики:', error);
            return [];
        }
        if (!data || data.length === 0) return [];

        // Группируем по дням
        const byDay = {};
        data.forEach(r => {
            const day = new Date(r.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            if (!byDay[day]) byDay[day] = { totalScore: 0, count: 0, passed: 0 };
            byDay[day].totalScore += r.score || 0;
            byDay[day].count += 1;
            if (r.is_passed) byDay[day].passed += 1;
        });

        return Object.entries(byDay).map(([date, d]) => ({
            date,
            avgScore: Math.round(d.totalScore / d.count),
            tests: d.count,
            passRate: d.count > 0 ? Math.round((d.passed / d.count) * 100) : 0
        }));
    },

    /**
     * Получить топ-учеников по среднему баллу.
     *
     * @param {string} classId - ID класса
     * @param {number} limit - Количество (по умолчанию 5)
     * @returns {Promise<Array>} [{ id, name, avatar, avgScore, testsCount }, ...]
     */
    async getTopStudents(classId, limit = 5) {
        const { students, members } = await getClassStudents(classId);
        if (students.length === 0) return [];

        const { data: testResults, error } = await supabase
            .from('user_test_results')
            .select('user_id, score')
            .in('user_id', students);

        if (error) {
            console.error('Ошибка загрузки топ-учеников:', error);
            return [];
        }

        // Агрегируем по ученикам
        const byStudent = {};
        (testResults || []).forEach(r => {
            if (!byStudent[r.user_id]) byStudent[r.user_id] = { totalScore: 0, count: 0 };
            byStudent[r.user_id].totalScore += r.score || 0;
            byStudent[r.user_id].count += 1;
        });

        // Сортируем по среднему баллу (desc) и берём топ
        return Object.entries(byStudent)
            .map(([userId, d]) => {
                const member = members.find(m => m.student_id === userId);
                return {
                    id: userId,
                    name: member?.profile?.full_name || 'Ученик',
                    avatar: member?.profile?.avatar_url,
                    avgScore: Math.round(d.totalScore / d.count),
                    testsCount: d.count
                };
            })
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, limit);
    },

    /**
     * Получить прогресс прохождения курса учениками класса.
     * Считает сколько уроков было открыто каждым учеником (через user_lesson_progress).
     *
     * @param {string} classId - ID класса
     * @param {number} totalLessonsInCourse - Общее количество уроков в курсе
     * @returns {Promise<Object>} { averagePercent, studentsProgress: [{ name, opened, total, percent }] }
     */
    async getCourseProgressStats(classId, totalLessonsInCourse) {
        const { students, members } = await getClassStudents(classId);
        if (students.length === 0) return { averagePercent: 0, studentsProgress: [] };

        const { data: progress, error } = await supabase
            .from('user_lesson_progress')
            .select('user_id, lesson_id')
            .in('user_id', students);

        if (error) {
            console.error('Ошибка загрузки прогресса курса:', error);
            return { averagePercent: 0, studentsProgress: [] };
        }

        // Группируем по ученику: сколько уроков у каждого
        const byStudent = {};
        (progress || []).forEach(p => {
            if (!byStudent[p.user_id]) byStudent[p.user_id] = new Set();
            byStudent[p.user_id].add(p.lesson_id);
        });

        const total = totalLessonsInCourse || 1;
        let sumPercent = 0;

        const studentsProgress = members.map(m => {
            const opened = byStudent[m.student_id]?.size || 0;
            const percent = Math.min(Math.round((opened / total) * 100), 100);
            sumPercent += percent;
            return {
                id: m.student_id,
                name: m.profile?.full_name || 'Ученик',
                opened,
                total,
                percent
            };
        });

        // Сортируем по проценту (desc)
        studentsProgress.sort((a, b) => b.percent - a.percent);

        return {
            averagePercent: students.length > 0 ? Math.round(sumPercent / students.length) : 0,
            studentsProgress
        };
    },

    /**
     * Получить детальную статистику по каждому студенту в классе.
     * 
     * @param {string} classId - ID класса
     * @param {object} filters - { period: 'week'|'month'|'all' }
     * @returns {Promise<Array>} Массив студентов со всеми результатами
     */
    async getStudentsDetailedStats(classId, filters = {}) {
        const { period = 'all' } = filters;
        const periodStart = getPeriodStartDate(period);

        const { students, members } = await getClassStudents(classId);
        if (students.length === 0) return [];

        // Прогресс уроков
        const { data: lessonProgress, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .in('user_id', students);
        if (progressError) console.error('Ошибка получения прогресса:', progressError);

        // Результаты тестов с фильтром по периоду
        let testQuery = supabase
            .from('user_test_results')
            .select('*')
            .in('user_id', students)
            .order('created_at', { ascending: false });
        if (periodStart) testQuery = testQuery.gte('created_at', periodStart);

        const { data: testResults, error: testsError } = await testQuery;
        if (testsError) console.error('Ошибка получения результатов тестов:', testsError);

        return members.map(member => {
            const studentId = member.student_id;
            const studentProgress = (lessonProgress || []).filter(p => p.user_id === studentId);
            const studentTests = (testResults || []).filter(t => t.user_id === studentId);

            let avgScore = 0;
            if (studentTests.length > 0) {
                const sum = studentTests.reduce((acc, val) => acc + (val.score || 0), 0);
                avgScore = (sum / studentTests.length).toFixed(1);
            }

            return {
                id: studentId,
                name: member.profile?.full_name || 'Неизвестный ученик',
                avatar: member.profile?.avatar_url,
                progress: studentProgress,
                tests: studentTests,
                averageScore: Number(avgScore),
                totalTests: studentTests.length,
            };
        });
    },

    /**
     * Загрузить названия уроков по массиву lesson_id напрямую из таблицы lessons.
     * Используется как запасной вариант, если у класса нет привязанного предмета.
     * 
     * @param {string[]} lessonIds - массив ID уроков
     * @returns {Promise<Object>} Словарь { lessonId: название }
     */
    async getLessonTitlesByIds(lessonIds) {
        if (!lessonIds || lessonIds.length === 0) return {};

        const { data, error } = await supabase
            .from('lessons')
            .select('id, title_ru, title_tj')
            .in('id', lessonIds);

        if (error) {
            console.error('Ошибка загрузки названий уроков:', error);
            return {};
        }

        const titles = {};
        (data || []).forEach(l => {
            titles[l.id] = l.title_ru || l.title_tj || 'Тест';
        });
        return titles;
    }
};
