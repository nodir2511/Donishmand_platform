import React from 'react';
import { CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react';
import { utilsService } from '../../../services/apiService';
const { renderKatex } = utilsService;

// Экран результатов теста
const TestResultsScreen = ({
    results,
    lang,
    PASS_THRESHOLD,
    onRestart,
    onComplete,
    onClose,
}) => {
    // Блокировка прокрутки фона
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    // Текст варианта ответа с поддержкой обоих форматов: серверного и локального
    const getOptText = (opt) => {
        if (!opt) return '';
        return renderKatex(
            lang === 'tj'
                ? (opt.textTj || opt.textRu || opt.text || '')
                : (opt.textRu || opt.text || '')
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
            <div className="w-[95%] h-[90vh] bg-gaming-card/95 rounded-3xl border border-white/10 flex flex-col">
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
                                    {lang === 'ru' ? '+3 монеты в копилку' : '+3 танга ба хазина'}
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
                    {results.time_spent_seconds > 0 && (
                        <p className="text-gaming-textMuted text-sm mt-1 relative z-10 flex items-center justify-center gap-1.5">
                            <Clock size={14} />
                            {lang === 'ru' ? 'Время решения:' : 'Вақти ҳал:'} {Math.floor(results.time_spent_seconds / 60)}м {results.time_spent_seconds % 60}с
                        </p>
                    )}
                </div>

                {/* Детали ответов */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {results.details.map((detail, idx) => {
                        const isCorrect = detail.isCorrect ?? detail.is_correct ?? false;
                        const q = detail.question || {};

                        const questionText = renderKatex(
                            lang === 'tj'
                                ? (q.textTj || q.textRu || q.text || '')
                                : (q.textRu || q.text || '')
                        );

                        return (
                            <div key={q.id || idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="flex items-start gap-3">
                                    {isCorrect
                                        ? <CheckCircle className="text-green-400 mt-1 shrink-0" size={20} />
                                        : <XCircle className="text-red-400 mt-1 shrink-0" size={20} />
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium mb-2 flex gap-1">
                                            <span className="shrink-0">{idx + 1}.</span>
                                            <div dangerouslySetInnerHTML={{ __html: questionText }} className="[&>p]:inline [&>p]:m-0" />
                                        </div>

                                        {!isCorrect && (
                                            <div className="text-sm text-green-400 mt-1">
                                                {q.type === 'multiple_choice' && (() => {
                                                    const correctOpt = (q.options || []).find(o => o.id === q.correctId);
                                                    return correctOpt ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span>{lang === 'ru' ? 'Правильный ответ: ' : 'Ҷавоби дуруст: '}</span>
                                                            <span className="font-semibold" dangerouslySetInnerHTML={{ __html: getOptText(correctOpt) }} />
                                                        </div>
                                                    ) : null;
                                                })()}

                                                {q.type === 'numeric' && (() => {
                                                    const correctVal = (q.digits || []).join('');
                                                    return correctVal ? (
                                                        <span>
                                                            {lang === 'ru' ? 'Правильный ответ: ' : 'Ҷавоби дуруст: '}
                                                            <span className="font-bold font-mono">{correctVal}{q.unit ? ` ${q.unit}` : ''}</span>
                                                        </span>
                                                    ) : null;
                                                })()}

                                                {q.type === 'matching' && (
                                                    <span className="text-gaming-textMuted text-xs italic">
                                                        {lang === 'ru' ? 'Соответствие не совпало' : 'Мувофиқат дуруст набуд'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Действия */}
                <div className="p-6 border-t border-white/10 flex gap-4 justify-center">
                    <button onClick={onRestart} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">
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
};

export default React.memo(TestResultsScreen);
