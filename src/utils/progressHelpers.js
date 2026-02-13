/**
 * Получить статистику для одного урока
 * @param {string} lessonId - ID урока
 * @returns {object|null} - { totalAttempts, bestScore, avgErrorRate } или null
 */
export const getLessonStats = (lessonId) => {
    try {
        const history = JSON.parse(localStorage.getItem(`test_history_${lessonId}`) || '[]');
        if (!history || history.length === 0) return null;

        const totalAttempts = history.length;
        const bestScore = Math.max(...history.map(h => h.score));

        // Средний балл
        const avgScore = history.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts;
        // Средний процент ошибок = 100% - Средний балл
        const avgErrorRate = Math.round(100 - avgScore);

        // Время последней попытки
        const lastAttemptAt = history[history.length - 1].timestamp;

        return { totalAttempts, bestScore, avgErrorRate, avgScore, lastAttemptAt };
    } catch (e) {
        console.error('Error parsing lesson stats:', e);
        return null;
    }
};

/**
 * Получить агрегированную статистику для группы уроков (Темы или Раздела)
 * @param {Array<string>} lessonIds - массив ID уроков
 * @returns {object|null} - { completedLessons, avgErrorRate } или null
 */
export const getContainerStats = (lessonIds) => {
    if (!lessonIds || lessonIds.length === 0) return null;

    let totalAvgScore = 0;
    let completedLessonsCount = 0;

    lessonIds.forEach(id => {
        const stats = getLessonStats(id);
        if (stats) {
            totalAvgScore += stats.avgScore;
            completedLessonsCount++;
        }
    });

    if (completedLessonsCount === 0) return null;

    // Средний балл по всем пройденным урокам
    const overallAvgScore = totalAvgScore / completedLessonsCount;
    // Средний процент ошибок
    const avgErrorRate = Math.round(100 - overallAvgScore);

    return {
        completedLessons: completedLessonsCount,
        totalLessons: lessonIds.length,
        avgErrorRate
    };
};
