import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, ChevronLeft, ChevronRight, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import { utilsService } from '../../services/apiService';
const { renderKatex, shuffleArray } = utilsService;
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';
import MatchingQuestion from './questions/MatchingQuestion';
import NumericQuestion from './questions/NumericQuestion';
import TestResultsScreen from './questions/TestResultsScreen';
import ComponentErrorBoundary from '../common/ComponentErrorBoundary';

// Очистка объекта от undefined (PostgREST падает с ошибкой 400, если есть undefined)
// Сохраняем Date объекты нетронутыми
const cleanUndefined = (obj) => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(cleanUndefined);
    const result = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = cleanUndefined(obj[key]);
        }
    }
    return result;
};

const PASS_THRESHOLD = 80;

const TestViewer = ({ questions, lessonId, lang, onClose, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [testVersion, setTestVersion] = useState(0); // Используется для принудительного перемешивания
    const [shakeWarning, setShakeWarning] = useState(false); // Предупреждение при незаполненных ответах
    const [warningMessage, setWarningMessage] = useState('');
    const [lockedQuestions, setLockedQuestions] = useState(new Set()); // Вопросы, заблокированные после перехода

    // Определяем режим учителя, чтобы не сохранять прогресс
    const { isTeacher: rawIsTeacher, isAdmin } = useAuth();
    const isTeacher = rawIsTeacher || isAdmin;

    // --- НОВЫЙ АНТИЧИТ НАЧАЛО ---
    const [swapNotification, setSwapNotification] = useState(false);

    // Функция замены неотвеченных вопросов
    const swapUnansweredQuestions = useCallback(() => {
        // Учителей не наказываем
        if (isTeacher) return;

        setRandomizedQuestions(prev => {
            const lockedIds = new Set(lockedQuestions);
            const currentIds = new Set(prev.map(q => q.id));

            // Вопросы, на которые уже дан ответ (их не трогаем)
            const answeredQs = prev.filter(q => lockedIds.has(q.id));
            // Вопросы, на которые еще нет ответа (их надо заменить)
            const unansweredQs = prev.filter(q => !lockedIds.has(q.id));

            if (unansweredQs.length === 0) return prev; // Все отвечено

            // Доступные вопросы из базы, которых еще НЕТ в текущем тесте
            let availableQs = questions.filter(q => !currentIds.has(q.id));
            availableQs = shuffleArray(availableQs);

            const newUnansweredQs = unansweredQs.map((oldQ, index) => {
                // Если есть доступный новый вопрос - берем его
                if (index < availableQs.length) {
                    const newQ = availableQs[index];
                    if (newQ.type === 'multiple_choice') return { ...newQ, options: shuffleArray(newQ.options) };
                    if (newQ.type === 'matching') return { ...newQ, leftItems: shuffleArray(newQ.leftItems), rightItems: shuffleArray(newQ.rightItems) };
                    return newQ;
                }
                // Если новых вопросов не хватает (н-р всего 10 вопросов в БД),
                // просто заново перемешиваем варианты ответов в текущем вопросе
                const shuffledOldQ = { ...oldQ };
                if (shuffledOldQ.type === 'multiple_choice') shuffledOldQ.options = shuffleArray(shuffledOldQ.options);
                if (shuffledOldQ.type === 'matching') {
                    shuffledOldQ.leftItems = shuffleArray(shuffledOldQ.leftItems);
                    shuffledOldQ.rightItems = shuffleArray(shuffledOldQ.rightItems);
                }
                return shuffledOldQ;
            });

            // Показываем уведомление
            setSwapNotification(true);
            setTimeout(() => setSwapNotification(false), 5000);

            // Собираем новый список, сохраняя порядок: сначала отвеченные (или по их индексам),
            // но проще просто склеить отвеченные и новые в том же порядке.
            // Чтобы сохранить позиции, пройдемся по оригинальному массиву `prev`:
            let newIndex = 0;
            return prev.map(q => {
                if (lockedIds.has(q.id)) return q;
                return newUnansweredQs[newIndex++];
            });
        });
    }, [isTeacher, lockedQuestions, questions]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !showResults) {
                swapUnansweredQuestions();
            }
        };

        const handleWindowBlur = () => {
            if (!showResults) {
                swapUnansweredQuestions();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [swapUnansweredQuestions, showResults]);
    // --- НОВЫЙ АНТИЧИТ КОНЕЦ ---

    const progressKey = `test_progress_v2_${lessonId}`; // v2 принудительно начинает сначала

    // Рандомизация вопросов с восстановлением прогресса
    const [randomizedQuestions, setRandomizedQuestions] = useState(() => {
        if (!questions) return [];

        // Проверяем сохранённый прогресс
        const savedRaw = localStorage.getItem(progressKey);
        if (savedRaw && testVersion === 0) {
            try {
                const saved = JSON.parse(savedRaw);

                // ВАЛИДАЦИЯ КЭША:
                const isCacheValid = saved.questions && saved.questions.every(q =>
                    (q.textRu && q.textRu.trim().length > 0) || (q.textTj && q.textTj.trim().length > 0)
                );

                if (!isCacheValid) {
                    console.warn('Кэш теста содержит пустые вопросы. Очистка...');
                    localStorage.removeItem(progressKey);
                } else if (saved.questions && saved.answers && saved.locked) {
                    // Восстанавливаем ответы и блокировки
                    setAnswers(saved.answers);
                    setLockedQuestions(new Set(saved.locked));
                    setCurrentIndex(saved.currentIndex || 0);

                    // Отвеченные вопросы оставляем как были
                    const lockedIds = new Set(saved.locked);
                    const savedQuestions = saved.questions.filter(q => lockedIds.has(q.id));

                    // Для оставшихся мест берём новые перемешанные вопросы, исключая уже выбранные (по ID)
                    const usedIds = new Set(savedQuestions.map(q => q.id));
                    const remaining = shuffleArray(questions.filter(q => !usedIds.has(q.id)));
                    const neededCount = Math.min(10, questions.length) - savedQuestions.length;

                    const newQuestions = remaining.slice(0, Math.max(0, neededCount)).map(q => {
                        if (q.type === 'multiple_choice') return { ...q, options: shuffleArray(q.options) };
                        if (q.type === 'matching') return { ...q, leftItems: shuffleArray(q.leftItems), rightItems: shuffleArray(q.rightItems) };
                        return q;
                    });

                    return [...savedQuestions, ...newQuestions];
                }
            } catch (e) {
                console.warn('Ошибка восстановления прогресса теста:', e);
                localStorage.removeItem(progressKey);
            }
        }

        // Новый тест — стандартная рандомизация
        const shuffledAll = shuffleArray(questions);
        const selectedQuestions = shuffledAll.slice(0, 10);

        return selectedQuestions.map(q => {
            if (q.type === 'multiple_choice') return { ...q, options: shuffleArray(q.options) };
            if (q.type === 'matching') return { ...q, leftItems: shuffleArray(q.leftItems), rightItems: shuffleArray(q.rightItems) };
            return q;
        });
    });

    // При вызове handleRestart мы должны обновить randomizedQuestions.
    // Для этого используем useEffect, который следит за testVersion.
    useEffect(() => {
        if (testVersion > 0 && questions) {
            const shuffledAll = shuffleArray(questions);
            const selectedQuestions = shuffledAll.slice(0, 10);
            setRandomizedQuestions(selectedQuestions.map(q => {
                if (q.type === 'multiple_choice') return { ...q, options: shuffleArray(q.options) };
                if (q.type === 'matching') return { ...q, leftItems: shuffleArray(q.leftItems), rightItems: shuffleArray(q.rightItems) };
                return q;
            }));
        }
    }, [testVersion, questions]);

    const currentQuestion = randomizedQuestions[currentIndex];
    const totalQuestions = randomizedQuestions.length;

    // Автосохранение прогресса при изменении ответов/блокировок
    useEffect(() => {
        if (randomizedQuestions.length > 0 && !showResults) {
            const progressData = {
                questions: randomizedQuestions,
                answers,
                locked: [...lockedQuestions],
                currentIndex
            };
            localStorage.setItem(progressKey, JSON.stringify(progressData));
        }
    }, [answers, lockedQuestions, currentIndex, randomizedQuestions, showResults]);

    // Проверка заблокирован ли ответ на вопрос (блокируется только после перехода)
    const isQuestionLocked = useCallback((questionId) => {
        return lockedQuestions.has(questionId);
    }, [lockedQuestions]);

    // Заблокировать текущий вопрос (если ответ дан)
    const lockCurrentQuestion = () => {
        const q = randomizedQuestions[currentIndex];
        if (!q) return;
        const a = answers[q.id];
        if (a !== undefined && a !== null && a !== '') {
            setLockedQuestions(prev => new Set([...prev, q.id]));
        }
    };

    // Обработка ответа для различных типов вопросов
    const handleAnswer = useCallback((questionId, answer) => {
        // Если ответ уже заблокирован — не разрешаем менять
        if (lockedQuestions.has(questionId)) return;
        setAnswers(prev => {
            const newAnswers = { ...prev, [questionId]: answer };

            // Защита от undefined для Supabase (вызовет 400 ошибку)
            if (newAnswers[questionId] === undefined) {
                newAnswers[questionId] = null;
            }

            return newAnswers;
        });
    }, [lockedQuestions]);

    // Навигация
    const goNext = () => {
        if (currentIndex < totalQuestions - 1) {
            lockCurrentQuestion(); // Блокируем ответ при переходе
            setCurrentIndex(prev => prev + 1);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const [results, setResults] = useState(null);

    // Подсчёт неотвеченных вопросов
    const unansweredCount = useMemo(() => {
        return randomizedQuestions.filter(q => {
            const a = answers[q.id];
            if (a === undefined || a === null || a === '') return true;
            if (q.type === 'matching' && typeof a === 'object') {
                return Object.keys(a).length < q.leftItems.length;
            }
            return false;
        }).length;
    }, [answers, randomizedQuestions]);

    // Автоскрытие предупреждения через 3 секунды
    useEffect(() => {
        if (shakeWarning) {
            const timer = setTimeout(() => {
                setShakeWarning(false);
                setWarningMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [shakeWarning]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Отправить тест и рассчитать результаты (СЕРВЕРНАЯ ПРОВЕРКА)
    const handleSubmit = async () => {
        // Блокируем последний вопрос перед отправкой
        lockCurrentQuestion();

        if (unansweredCount > 0) {
            setShakeWarning(true);
            const msg = lang === 'ru'
                ? `Вы не ответили на ${unansweredCount} ${unansweredCount === 1 ? 'вопрос' : unansweredCount < 5 ? 'вопроса' : 'вопросов'}!`
                : `Шумо ба ${unansweredCount} савол ҷавоб надодаед!`;
            setWarningMessage(msg);
            return;
        }

        setIsSubmitting(true);
        const assignedIds = randomizedQuestions.map(q => q.id);

        try {
            // Если учитель, генерируем детали локально (учителя не сохраняют прогресс в БД)
            if (isTeacher) {
                let localCorrect = 0;
                const details = randomizedQuestions.map(q => {
                    const userAnswer = answers[q.id];
                    let isCorrect = false;

                    if (q.type === 'multiple_choice') isCorrect = userAnswer === q.correctId;
                    else if (q.type === 'matching') isCorrect = Object.entries(q.correctMatches || {}).every(([l, r]) => userAnswer?.[l] === r);
                    else if (q.type === 'numeric') isCorrect = userAnswer === (q.digits || []).join('');

                    if (isCorrect) localCorrect++;
                    return { question: q, userAnswer, isCorrect };
                });
                const score = Math.round((localCorrect / totalQuestions) * 100);
                setResults({
                    correct: localCorrect,
                    total: totalQuestions,
                    score,
                    isPassed: score >= PASS_THRESHOLD,
                    details
                });
            } else {
                // Очистка ответов от undefined рекурсивно
                const cleanedAnswers = cleanUndefined(answers);
                const cleanedIds = cleanUndefined(assignedIds);

                // Если ученик, вызываем безопасную серверную функцию RPM
                const { data: serverResults, error } = await supabase.rpc('evaluate_test', {
                    p_lesson_id: lessonId,
                    p_user_answers: cleanedAnswers,
                    p_question_ids: cleanedIds
                });

                if (error) throw error;

                // Сбор монет в localStorage для мгновенного отображения
                if (serverResults.isPassed) {
                    const currentCoins = parseInt(localStorage.getItem('user_coins') || '0');
                    localStorage.setItem('user_coins', (currentCoins + 3).toString());
                }

                // Локальная история для графика успеваемости
                const historyKey = `test_history_${lessonId}`;
                const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
                const newResult = {
                    score: serverResults.score,
                    correct: serverResults.correct,
                    total: serverResults.total,
                    timestamp: Date.now(),
                    passed: serverResults.isPassed
                };
                localStorage.setItem(historyKey, JSON.stringify([...currentHistory, newResult]));
                localStorage.setItem(`test_result_${lessonId}`, JSON.stringify(newResult));

                setResults(serverResults);
            }

            setShowResults(true);
            localStorage.removeItem(progressKey);
        } catch (err) {
            console.error('Ошибка проверки теста на сервере:', err);

            const errDetails = err?.message || err?.details || JSON.stringify(err);

            // Если ошибка, предлагаем очистить старую попытку (кэш) и начать заново
            const confirmClear = window.confirm(
                lang === 'ru'
                    ? `Произошла ошибка при сохранении результатов.\nДоп. инфо: ${errDetails}\n\nВозможно, ваша старая попытка (кэш) содержит устаревшие данные.\nХотите очистить старую попытку и начать тест заново?`
                    : `Хатогӣ ҳангоми нигоҳдории натиҷаҳо.\nТафсилот: ${errDetails}\n\nЭҳтимол кӯшиши кӯна маълумоти нодуруст дорад.\nМехоҳед тоза кунед ва аз нав оғоз кунед?`
            );

            if (confirmClear) {
                // Очищаем прогресс и перезапускаем
                localStorage.removeItem(progressKey);
                setCurrentIndex(0);
                setAnswers({});
                setShakeWarning(false);
                setWarningMessage('');
                setLockedQuestions(new Set());
                setResults(null);
                setShowResults(false);
                setTestVersion(v => v + 1);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Перезапустить тест
    const handleRestart = useCallback(() => {
        localStorage.removeItem(progressKey); // Очищаем сохранённый прогресс
        setCurrentIndex(0);
        setAnswers({});
        setShakeWarning(false);
        setWarningMessage('');
        setLockedQuestions(new Set()); // Сброс блокировок
        setResults(null);
        setShowResults(false);
        setTestVersion(v => v + 1); // Перемешиваем заново при перезапуске
    }, [progressKey]);

    // Получить текст вопроса в зависимости от языка (с поддержкой KaTeX-формул)
    const getQuestionText = useCallback((q) => {
        const text = lang === 'tj' ? (q.textTj || q.textRu) : q.textRu;
        return renderKatex(text || '');
    }, [lang]);
    const getOptionText = useCallback((opt) => {
        const text = lang === 'tj' ? (opt.textTj || opt.textRu) : opt.textRu;
        return renderKatex(text || '');
    }, [lang]);

    // Вспомогательный компонент для рендеринга текста с KaTeX
    const KatexText = ({ html, className = '', tag = 'span' }) => {
        const Tag = tag;
        return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-gaming-card/95 rounded-2xl p-8 text-center max-w-md">
                    <XCircle size={48} className="mx-auto mb-4 text-red-400" />
                    <h3 className="text-xl font-bold mb-2">{lang === 'ru' ? 'Нет вопросов' : 'Саволе нест'}</h3>
                    <p className="text-gaming-textMuted mb-4">{lang === 'ru' ? 'Тест пока не содержит вопросов' : 'Тест ҳанӯз савол надорад'}</p>
                    <button onClick={onClose} className="px-6 py-2 bg-gaming-primary text-white rounded-xl">{lang === 'ru' ? 'Закрыть' : 'Пӯшидан'}</button>
                </div>
            </div>
        );
    }

    // Экран результатов
    if (showResults && results) {
        return (
            <TestResultsScreen
                results={results}
                lang={lang}
                PASS_THRESHOLD={PASS_THRESHOLD}
                onRestart={handleRestart}
                onComplete={onComplete}
                onClose={onClose}
            />
        );
    }

    // Экран вопроса
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none"
            onContextMenu={(e) => e.preventDefault()}
            style={{
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                userSelect: 'none'
            }}>

            {/* УВЕДОМЛЕНИЕ ОБ АНТИЧИТЕ (ЗАМЕНА ВОПРОСОВ) */}
            {swapNotification && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-red-500/90 backdrop-blur border border-red-500 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-in slide-in-from-top fade-in duration-300">
                    <AlertTriangle size={24} className="animate-pulse" />
                    <div>
                        <h4 className="font-bold text-lg leading-tight">
                            {lang === 'ru' ? 'Подозрительная активность!' : 'Фаъолияти шубҳанок!'}
                        </h4>
                        <p className="text-sm text-balance">
                            {lang === 'ru' ? 'Так как вы покинули вкладку, все неотвеченные вопросы были заменены во избежание списывания.' : 'Азбаски шумо саҳифаро тарк кардед, ҳамаи саволҳои ҷавобдоданашуда иваз карда шуданд.'}
                        </p>
                    </div>
                </div>
            )}

            <div className={`w-full max-w-2xl bg-gaming-card/95 rounded-3xl border border-white/10 overflow-hidden relative transition-all duration-300 flex flex-col max-h-[90vh]`}>

                {/* ВОДЯНОЙ ЗНАК */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.03] flex flex-wrap content-center justify-center gap-8 rotate-12 scale-150">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="text-2xl font-black text-white whitespace-nowrap">
                            DONISHMAND PLATFORM
                        </div>
                    ))}
                </div>

                {/* Шапка модального окна */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold">
                            {lang === 'ru' ? 'Вопрос' : 'Савол'} {currentIndex + 1} / {totalQuestions}
                        </span>
                        <div className="flex gap-1">
                            {randomizedQuestions.map((q, idx) => {
                                const hasAnswer = (() => {
                                    const a = answers[q?.id];
                                    if (a === undefined || a === null || a === '') return false;
                                    if (q?.type === 'matching' && typeof a === 'object') {
                                        return Object.keys(a).length >= q.leftItems.length;
                                    }
                                    return true;
                                })();
                                const isUnanswered = shakeWarning && !hasAnswer;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        title={`${lang === 'ru' ? 'Вопрос' : 'Савол'} ${idx + 1}${!hasAnswer ? (lang === 'ru' ? ' (нет ответа)' : ' (ҷавоб нест)') : ''}`}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer hover:scale-150 ${idx === currentIndex ? 'bg-gaming-primary scale-125' : hasAnswer ? 'bg-white/60' : isUnanswered ? 'bg-red-500 animate-pulse scale-125' : 'bg-white/20 hover:bg-white/40'}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gaming-textMuted hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Вопрос */}
                <div className="p-6 relative z-10 overflow-y-auto flex-1">
                    <div
                        className="text-xl font-medium mb-6 prose prose-invert max-w-none [&>p]:inline [&>p]:m-0"
                        dangerouslySetInnerHTML={{ __html: getQuestionText(currentQuestion) }}
                    />
                    {currentQuestion.image && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex justify-center">
                            <img src={currentQuestion.image} alt="Question" className="max-w-full max-h-[400px] object-contain" />
                        </div>
                    )}

                    {/* Один из многих (выбор варианта) */}
                    {currentQuestion.type === 'multiple_choice' && (
                        <MultipleChoiceQuestion
                            question={currentQuestion}
                            answer={answers[currentQuestion.id]}
                            isLocked={isQuestionLocked(currentQuestion.id)}
                            lang={lang}
                            onAnswer={handleAnswer}
                            getOptionText={getOptionText}
                        />
                    )}

                    {/* Установление соответствия */}
                    {currentQuestion.type === 'matching' && (
                        <MatchingQuestion
                            question={currentQuestion}
                            answer={answers[currentQuestion.id]}
                            isLocked={isQuestionLocked(currentQuestion.id)}
                            lang={lang}
                            onAnswer={handleAnswer}
                            getOptionText={getOptionText}
                        />
                    )}

                    {/* Числовой ответ */}
                    {currentQuestion.type === 'numeric' && (
                        <NumericQuestion
                            question={currentQuestion}
                            answer={answers[currentQuestion.id]}
                            isLocked={isQuestionLocked(currentQuestion.id)}
                            lang={lang}
                            onAnswer={handleAnswer}
                        />
                    )}
                </div>

                {/* Подвал */}
                <div className="flex items-center justify-between p-4 border-t border-white/10 relative z-10">
                    {currentIndex > 0 ? (
                        <button onClick={goPrev}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:bg-white/10">
                            <ChevronLeft size={18} />
                            {lang === 'ru' ? 'Назад' : 'Қафо'}
                        </button>
                    ) : <div />}

                    {currentIndex === totalQuestions - 1 ? (
                        <div className="flex flex-col items-end gap-2">
                            {/* Предупреждение о незаполненных ответах */}
                            {shakeWarning && warningMessage && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-sm animate-bounce">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    <span>{warningMessage}</span>
                                </div>
                            )}
                            <button onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${shakeWarning
                                    ? 'bg-red-500/80 text-white animate-[shake_0.5s_ease-in-out]'
                                    : isSubmitting
                                        ? 'bg-gaming-primary/50 text-white cursor-not-allowed'
                                        : 'bg-gaming-primary text-white hover:bg-gaming-primary/80'
                                    }`}>
                                {isSubmitting ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                ) : (
                                    <CheckCircle size={18} />
                                )}
                                {isSubmitting ? (lang === 'ru' ? 'Проверка...' : 'Тафтиш...') : (lang === 'ru' ? 'Завершить тест' : 'Тамом кардан')}
                            </button>
                        </div>
                    ) : (
                        <button onClick={goNext}
                            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-xl">
                            {lang === 'ru' ? 'Далее' : 'Оянда'}
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
export default function WrappedTestViewer(props) {
    return (
        <ComponentErrorBoundary>
            <TestViewer {...props} />
        </ComponentErrorBoundary>
    );
}
