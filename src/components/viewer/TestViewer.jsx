import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, ArrowRight, ChevronLeft, ChevronRight, Trophy, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import { shuffleArray } from '../../utils/shuffle';

const PASS_THRESHOLD = 80;

const TestViewer = ({ questions, lessonId, lang, onClose, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [testVersion, setTestVersion] = useState(0); // Используется для принудительного перемешивания
    const [shakeWarning, setShakeWarning] = useState(false); // Предупреждение при незаполненных ответах
    const [warningMessage, setWarningMessage] = useState('');
    const [lockedQuestions, setLockedQuestions] = useState(new Set()); // Вопросы, заблокированные после перехода

    // --- ФУНКЦИИ БЕЗОПАСНОСТИ НАЧАЛО ---
    const [isFocused, setIsFocused] = useState(true);

    React.useEffect(() => {
        const checkFocus = () => {
            // Агрессивная проверка фокуса для всех браузеров
            const hasFocus = document.hasFocus() && !document.hidden;
            setIsFocused(hasFocus);
        };

        // Слушатели событий
        window.addEventListener('focus', checkFocus);
        window.addEventListener('blur', checkFocus);
        document.addEventListener('visibilitychange', checkFocus);

        // Интервал для перестраховки (на случай если события не сработают)
        const interval = setInterval(checkFocus, 300);

        return () => {
            window.removeEventListener('focus', checkFocus);
            window.removeEventListener('blur', checkFocus);
            document.removeEventListener('visibilitychange', checkFocus);
            clearInterval(interval);
        };
    }, []);
    // --- ФУНКЦИИ БЕЗОПАСНОСТИ КОНЕЦ ---

    const progressKey = `test_progress_${lessonId}`;

    // Рандомизация вопросов с восстановлением прогресса
    const randomizedQuestions = useMemo(() => {
        if (!questions) return [];

        // Проверяем сохранённый прогресс
        const savedRaw = localStorage.getItem(progressKey);
        if (savedRaw && testVersion === 0) {
            try {
                const saved = JSON.parse(savedRaw);
                if (saved.questions && saved.answers && saved.locked) {
                    // Восстанавливаем ответы и блокировки
                    setAnswers(saved.answers);
                    setLockedQuestions(new Set(saved.locked));
                    setCurrentIndex(saved.currentIndex || 0);

                    // Отвеченные вопросы оставляем как были
                    const lockedIds = new Set(saved.locked);
                    const savedQuestions = saved.questions.filter(q => lockedIds.has(q.id));

                    // Для оставшихся мест берём новые перемешанные вопросы
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
    }, [questions, testVersion]);

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
    const isQuestionLocked = (questionId) => {
        return lockedQuestions.has(questionId);
    };

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
    const handleAnswer = (questionId, answer) => {
        // Если ответ уже заблокирован — не разрешаем менять
        if (isQuestionLocked(questionId)) return;
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

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

    // Отправить тест и рассчитать результаты
    const handleSubmit = () => {
        // Валидация: проверяем наличие ответов на все вопросы
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
        let correct = 0;
        const details = randomizedQuestions.map(q => {
            const userAnswer = answers[q.id];
            let isCorrect = false;

            if (q.type === 'multiple_choice') {
                isCorrect = userAnswer === q.correctId;
            } else if (q.type === 'matching') {
                isCorrect = Object.entries(q.correctMatches).every(
                    ([left, right]) => userAnswer?.[left] === right
                );
            } else if (q.type === 'numeric') {
                const correctValue = q.digits.join('');
                isCorrect = userAnswer === correctValue;
            }

            if (isCorrect) correct++;
            return { question: q, userAnswer, isCorrect };
        });

        const score = Math.round((correct / totalQuestions) * 100);
        const isPassed = score >= PASS_THRESHOLD;

        // Сохранение результата в localStorage (история)
        const historyKey = `test_history_${lessonId}`;
        const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');

        const newResult = {
            score,
            correct,
            total: totalQuestions,
            timestamp: Date.now(),
            passed: isPassed
        };

        const updatedHistory = [...currentHistory, newResult];
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

        // Сохранение последнего результата (для обратной совместимости)
        localStorage.setItem(`test_result_${lessonId}`, JSON.stringify(newResult));

        // Сбор монет при успешной сдаче
        if (isPassed) {
            const currentCoins = parseInt(localStorage.getItem('user_coins') || '0');
            localStorage.setItem('user_coins', (currentCoins + 1).toString());
        }

        setResults({ correct, total: totalQuestions, score, isPassed, details });
        setShowResults(true);

        // Очищаем сохранённый прогресс после завершения теста
        localStorage.removeItem(progressKey);
    };

    // Перезапустить тест
    const handleRestart = () => {
        localStorage.removeItem(progressKey); // Очищаем сохранённый прогресс
        setCurrentIndex(0);
        setAnswers({});
        setShakeWarning(false);
        setWarningMessage('');
        setLockedQuestions(new Set()); // Сброс блокировок
        setResults(null);
        setShowResults(false);
        setTestVersion(v => v + 1); // Перемешиваем заново при перезапуске
    };

    // Получить текст вопроса в зависимости от языка
    const getQuestionText = (q) => lang === 'tj' ? (q.textTj || q.textRu) : q.textRu;
    const getOptionText = (opt) => lang === 'tj' ? (opt.textTj || opt.textRu) : opt.textRu;

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-full max-w-2xl bg-gaming-card/95 rounded-3xl border border-white/10 my-8">
                    {/* Заголовок */}
                    <div className="p-6 border-b border-white/10 text-center relative overflow-hidden">
                        {results.isPassed ? (
                            <>
                                <div className="absolute inset-0 bg-green-500/10" />
                                <div className="relative z-10">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-bounce">
                                        <div className="w-20 h-20 border-4 border-yellow-600 rounded-full flex items-center justify-center bg-yellow-300">
                                            <span className="text-4xl font-bold text-yellow-700">$</span>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2 text-green-400">
                                        {lang === 'ru' ? 'Тест сдан!' : 'Тест супорида шуд!'}
                                    </h2>
                                    <p className="text-green-300/80 mb-2">
                                        {lang === 'ru' ? '+1 монета в копилку' : '+1 танга ба хазина'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-red-500/10" />
                                <div className="relative z-10">
                                    <XCircle size={64} className="mx-auto mb-4 text-red-500" />
                                    <h2 className="text-3xl font-bold mb-2 text-red-400">
                                        {lang === 'ru' ? 'Тест не сдан' : 'Тест супорида нашуд'}
                                    </h2>
                                    <p className="text-red-300/80 mb-2">
                                        {lang === 'ru' ? `Нужно набрать минимум ${PASS_THRESHOLD}%` : `Бояд ҳадди аққал ${PASS_THRESHOLD}% гиред`}
                                    </p>
                                </div>
                            </>
                        )}

                        <div className={`text-5xl font-bold mb-2 relative z-10 ${results.isPassed ? 'text-green-400' : 'text-red-400'}`}>
                            {results.score}%
                        </div>
                        <p className="text-gaming-textMuted relative z-10">
                            {results.correct} / {results.total} {lang === 'ru' ? 'правильных ответов' : 'ҷавоби дуруст'}
                        </p>
                    </div>

                    {/* Детали */}
                    <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4">
                        {results.details.map((detail, idx) => (
                            <div key={detail.question.id} className={`p-4 rounded-xl border ${detail.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="flex items-start gap-3">
                                    {detail.isCorrect ? <CheckCircle className="text-green-400 mt-1" size={20} /> : <XCircle className="text-red-400 mt-1" size={20} />}
                                    <div className="flex-1">
                                        <div className="font-medium mb-1 flex gap-1">
                                            <span>{idx + 1}.</span>
                                            <div dangerouslySetInnerHTML={{ __html: getQuestionText(detail.question) }} className="[&>p]:inline [&>p]:m-0" />
                                        </div>
                                        {!detail.isCorrect && detail.question.type === 'multiple_choice' && (
                                            <div className="text-sm text-green-400 flex flex-wrap gap-1">
                                                <span>{lang === 'ru' ? 'Правильный ответ: ' : 'Ҷавоби дуруст: '}</span>
                                                <span className="font-semibold">{getOptionText(detail.question.options.find(o => o.id === detail.question.correctId))}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Действия */}
                    <div className="p-6 border-t border-white/10 flex gap-4 justify-center">
                        <button onClick={handleRestart} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">
                            <RotateCcw size={18} />
                            {lang === 'ru' ? 'Пройти заново' : 'Аз нав'}
                        </button>
                        {results.isPassed && (
                            <button onClick={() => { if (onComplete) onComplete(results); onClose(); }} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-[0_0_15px_rgba(22,163,74,0.5)]">
                                <CheckCircle size={18} />
                                {lang === 'ru' ? 'Забрать награду' : 'Гирифтани мукофот'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
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

            {/* ОВЕРЛЕЙ РАЗМЫТИЯ (БЕЗОПАСНОСТЬ) */}
            {!isFocused && (
                <div className="fixed inset-0 z-[100] backdrop-blur-3xl flex items-center justify-center bg-black/90 cursor-not-allowed"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="text-center p-6">
                        <XCircle size={64} className="mx-auto mb-4 text-red-500 animate-pulse" />
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {lang === 'ru' ? 'Вернитесь к тесту!' : 'Ба тест баргардед!'}
                        </h3>
                        <p className="text-white/80">
                            {lang === 'ru' ? 'Контент скрыт при потере фокуса' : 'Мундариҷа ҳангоми гум кардани фокус пинҳон карда мешавад'}
                        </p>
                    </div>
                </div>
            )}

            <div className={`w-full max-w-2xl bg-gaming-card/95 rounded-3xl border border-white/10 overflow-hidden relative transition-all duration-300 ${!isFocused ? 'opacity-0 pointer-events-none' : ''}`}>

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
                <div className="p-6 relative z-10">
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
                    {currentQuestion.type === 'multiple_choice' && (() => {
                        const locked = isQuestionLocked(currentQuestion.id);
                        return (
                            <div className="space-y-3">
                                {locked && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm text-gaming-textMuted">
                                        <Lock size={14} />
                                        <span>{lang === 'ru' ? 'Ответ зафиксирован' : 'Ҷавоб қайд шуд'}</span>
                                    </div>
                                )}
                                {currentQuestion.options.map((opt, idx) => {
                                    const isSelected = answers[currentQuestion.id] === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                                            disabled={locked}
                                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isSelected
                                                ? 'bg-gaming-primary/20 border-gaming-primary'
                                                : locked
                                                    ? 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isSelected ? 'bg-gaming-primary text-white' : 'bg-white/10'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <div className="flex flex-col gap-2 w-full">
                                                <span>{getOptionText(opt)}</span>
                                                {opt.image && (
                                                    <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20 max-w-[200px]">
                                                        <img src={opt.image} alt="Option" className="w-full h-auto object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && locked && <Lock size={16} className="text-gaming-textMuted shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {/* Установление соответствия */}
                    {currentQuestion.type === 'matching' && (
                        <div className="space-y-6">
                            {/* Списки определений (Варианты) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-white/10">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gaming-pink uppercase tracking-wider mb-2">
                                        {lang === 'ru' ? 'Группа 1' : 'Гурӯҳи 1'}
                                    </p>
                                    {currentQuestion.leftItems.map((left, idx) => (
                                        <div key={left.id} className="text-sm flex gap-2 items-start">
                                            <span className="font-bold text-gaming-pink min-w-[20px] pt-1">{String.fromCharCode(65 + idx)})</span>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gaming-textMuted leading-tight">{getOptionText(left)}</span>
                                                {left.image && (
                                                    <img src={left.image} alt="Item" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gaming-accent uppercase tracking-wider mb-2">
                                        {lang === 'ru' ? 'Группа 2' : 'Гурӯҳи 2'}
                                    </p>
                                    {currentQuestion.rightItems.map((right, idx) => (
                                        <div key={right.id} className="text-sm flex gap-2 items-start">
                                            <span className="font-bold text-gaming-accent min-w-[20px] pt-1">{idx + 1})</span>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gaming-textMuted leading-tight">{getOptionText(right)}</span>
                                                {right.image && (
                                                    <img src={right.image} alt="Item" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-sm text-gaming-textMuted text-center">{lang === 'ru' ? 'Выберите соответствия в сетке:' : 'Мувофиқатро дар ҷадвал интихоб кунед:'}</p>

                            {/* Сетка (Матрица) - уменьшенная */}
                            <div className="flex justify-center">
                                <div className="overflow-x-auto max-w-full pb-2">
                                    <table className="border-separate border-spacing-1">
                                        <thead>
                                            <tr>
                                                <th className="w-8"></th>
                                                {currentQuestion.rightItems.map((right, idx) => (
                                                    <th key={right.id} className="text-center font-bold text-gaming-accent text-sm p-1">
                                                        {idx + 1}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentQuestion.leftItems.map((left, idx) => (
                                                <tr key={left.id}>
                                                    <td className="text-center font-bold text-gaming-pink text-sm p-1">
                                                        {String.fromCharCode(65 + idx)}
                                                    </td>
                                                    {currentQuestion.rightItems.map(right => {
                                                        const isSelected = answers[currentQuestion.id]?.[left.id] === right.id;
                                                        const matchingLocked = isQuestionLocked(currentQuestion.id);
                                                        return (
                                                            <td key={right.id} className="text-center p-0.5">
                                                                <button
                                                                    onClick={() => handleAnswer(currentQuestion.id, {
                                                                        ...(answers[currentQuestion.id] || {}),
                                                                        [left.id]: right.id
                                                                    })}
                                                                    disabled={matchingLocked}
                                                                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                                                                        ${isSelected
                                                                            ? 'bg-gaming-primary border-gaming-primary'
                                                                            : matchingLocked
                                                                                ? 'bg-white/5 border-white/10 opacity-30 cursor-not-allowed'
                                                                                : 'bg-white/5 border-white/20 hover:border-white/40'}`}
                                                                >
                                                                    {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Числовой ответ */}
                    {currentQuestion.type === 'numeric' && (() => {
                        const numericLocked = isQuestionLocked(currentQuestion.id);
                        return (
                            <div className="space-y-4">
                                <p className="text-sm text-gaming-textMuted">
                                    {numericLocked
                                        ? <span className="flex items-center gap-2"><Lock size={14} /> {lang === 'ru' ? 'Ответ зафиксирован' : 'Ҷавоб қайд шуд'}</span>
                                        : (lang === 'ru' ? 'Введите ответ:' : 'Ҷавобро ворид кунед:')}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    {[0, 1, 2, 3].map(idx => (
                                        <input
                                            key={idx}
                                            type="text"
                                            maxLength={1}
                                            disabled={numericLocked}
                                            value={(answers[currentQuestion.id] || '')[idx] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val && !/^\d$/.test(val)) return;
                                                const current = answers[currentQuestion.id] || '';
                                                const arr = current.split('');
                                                arr[idx] = val;
                                                handleAnswer(currentQuestion.id, arr.join(''));
                                                // Автофокус на следующий ввод
                                                if (val && idx < 3) {
                                                    const next = e.target.nextElementSibling;
                                                    if (next) next.focus();
                                                }
                                            }}
                                            className={`w-14 h-14 text-center text-2xl font-bold rounded-lg text-white focus:outline-none ${numericLocked
                                                ? 'bg-gaming-bg/50 border-2 border-gaming-primary/30 opacity-70 cursor-not-allowed'
                                                : 'bg-gaming-bg/50 border-2 border-white/20 focus:border-gaming-primary'
                                                }`}
                                        />
                                    ))}
                                    {currentQuestion.unit && (
                                        <span className="text-xl text-gaming-textMuted ml-2">{currentQuestion.unit}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Подвал */}
                <div className="flex items-center justify-between p-4 border-t border-white/10 relative z-10">
                    <button onClick={goPrev} disabled={currentIndex === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentIndex === 0 ? 'text-white/30 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}>
                        <ChevronLeft size={18} />
                        {lang === 'ru' ? 'Назад' : 'Қафо'}
                    </button>

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
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${shakeWarning
                                    ? 'bg-red-500/80 text-white animate-[shake_0.5s_ease-in-out]'
                                    : 'bg-gaming-primary text-white hover:bg-gaming-primary/80'
                                    }`}>
                                <CheckCircle size={18} />
                                {lang === 'ru' ? 'Завершить тест' : 'Тамом кардан'}
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

export default TestViewer;
