import { supabase } from './supabase';

/**
 * Service for fetching and aggregating statistics for classes and students.
 */
export const statisticsService = {
    /**
     * Получить общую статистику по классу (сводка).
     * Рассчитывает средний прогресс и результаты тестов всех учеников в классе.
     * 
     * @param {string} classId - ID класса
     * @returns {Promise<Object>} Обобщенные данные класса
     */
    async getClassSummaryStats(classId) {
        // 1. Получить список всех студентов в классе (через users_classes / profiles)

        const { data: members, error: membersError } = await supabase
            .from('class_members')
            .select(`
        student_id,
        profile:profiles!class_members_student_id_fkey (id, full_name, role)
      `)
            .eq('class_id', classId);

        if (membersError) {
            console.error('Ошибка получения списка учеников:', membersError);
            return null;
        }

        const students = members
            .filter(m => m.profile?.role === 'student' || !m.profile?.role)
            .map(m => m.student_id);

        if (students.length === 0) {
            return { studentsCount: 0, averageTestScore: 0, totalTestsTaken: 0, averageProgress: 0, testsBreakdown: [] };
        }

        // 2. Получить результаты тестов
        const { data: testResults, error: testsError } = await supabase
            .from('user_test_results')
            .select('*')
            .in('user_id', students);

        if (testsError) {
            console.error('Ошибка получения результатов тестов:', testsError);
            return null; // или throw
        }

        // 3. Получить прогресс уроков
        const { data: lessonProgress, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .in('user_id', students);

        if (progressError) {
            console.error('Ошибка получения прогресса:', progressError);
            return null;
        }

        // Агрегация данных по урокам (тесты)
        let totalScore = 0;
        const testsByLesson = {};

        testResults.forEach(tr => {
            totalScore += tr.score || 0;

            if (!testsByLesson[tr.lesson_id]) {
                testsByLesson[tr.lesson_id] = { totalScore: 0, count: 0, fails: 0, avgTimeSpentMinutes: 0, lessonId: tr.lesson_id };
            }

            testsByLesson[tr.lesson_id].totalScore += tr.score || 0;
            testsByLesson[tr.lesson_id].count += 1;

            // Время потраченное на тест, пока нет такого поля в БД закоментируем
            // if (tr.time_spent_seconds) { ... }

            if (!tr.is_passed) {
                testsByLesson[tr.lesson_id].fails += 1;
            }
        });

        const averageTestScore = testResults.length > 0 ? (totalScore / testResults.length).toFixed(1) : 0;

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
            studentsCount: students.length,
            averageTestScore: Number(averageTestScore),
            totalTestsTaken: testResults.length,
            averageProgress: 0, // Не используется или считается потом
            testsBreakdown
        };
    },

    /**
     * Получить детальную статистику по каждому студенту в классе.
     * 
     * @param {string} classId - ID класса
     * @returns {Promise<Array>} Массив студентов со всеми результатами
     */
    async getStudentsDetailedStats(classId) {
        const { data: members, error: membersError } = await supabase
            .from('class_members')
            .select(`
             student_id,
             profile:profiles!class_members_student_id_fkey(id, full_name, avatar_url, role)
        `)
            .eq('class_id', classId);

        if (membersError) {
            console.error('Ошибка получения списка учеников:', membersError);
            return [];
        }

        const students = members
            .filter(m => m.profile?.role === 'student' || !m.profile?.role)
            .map(m => m.student_id);

        if (students.length === 0) return [];

        // Прогресс уроков
        const { data: lessonProgress, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .in('user_id', students);

        if (progressError) {
            console.error('Ошибка получения прогресса:', progressError);
        }

        // Результаты тестов
        const { data: testResults, error: testsError } = await supabase
            .from('user_test_results')
            .select('*')
            .in('user_id', students)
            .order('created_at', { ascending: false });

        if (testsError) {
            console.error('Ошибка получения результатов тестов:', testsError);
        }

        return members
            .filter(m => m.profile?.role === 'student' || !m.profile?.role)
            .map(member => {
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
    }
};
