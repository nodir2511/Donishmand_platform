const progress = {
    testHistory: [
        { score: 50, timestamp: 1234567890 },
        { score: 90, timestamp: 1234567990 }
    ]
};

const PASS_THRESHOLD = 80;

try {
    if (!progress.testHistory || progress.testHistory.length === 0) {
        console.log('No history');
    } else {
        const totalAttempts = progress.testHistory.length;
        const bestScore = Math.max(...progress.testHistory.map(h => h.score));

        // Средний процент ошибок = 100% - Средний балл
        const avgScore = progress.testHistory.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts;
        const avgErrorRate = Math.round(100 - avgScore);

        // Время последней попытки
        const lastAttemptAt = progress.testHistory[progress.testHistory.length - 1].timestamp;

        const isPassed = bestScore >= PASS_THRESHOLD;

        const stats = { totalAttempts, bestScore, avgErrorRate, lastAttemptAt, isPassed };
        console.log('Stats:', stats);
    }
} catch (e) {
    console.error('Error:', e);
}
