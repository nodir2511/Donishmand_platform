import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Video, FileText, Presentation, CheckCircle, Check, Clock, RotateCcw
} from 'lucide-react';

// Компонент карточки прогресса урока
const ProgressCard = ({
    hasVideo,
    hasText,
    hasSlides,
    hasTest,
    progress,
    allSlidesViewed,
    viewedSlidesCount,
    totalSlides,
    testStats,
    completedSteps,
    totalSteps,
    completionPercentage,
    lang,
}) => {
    const { t } = useTranslation();

    return (
        <div className="mb-8 bg-gradient-to-br from-gaming-primary/20 to-gaming-pink/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h4 className="font-bold text-lg mb-1">{t('lesson.progress')}</h4>
                        <p className="text-gaming-textMuted text-sm">
                            {completedSteps} / {totalSteps} {t('lesson.stepsCompleted')}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-gaming-primary">{completionPercentage}%</div>
                    </div>
                </div>

                {/* Прогресс бар */}
                <div className="w-full h-3 bg-black/30 rounded-full mb-6 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-gaming-primary to-gaming-pink transition-all duration-1000 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {hasVideo && (
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${progress.videoWatched
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-white/5 border-white/10 text-gaming-textMuted'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${progress.videoWatched ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                {progress.videoWatched ? <Check size={20} /> : <Video size={20} />}
                            </div>
                            <span className="font-medium text-sm">{t('lesson.video')}</span>
                        </div>
                    )}

                    {hasText && (
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${progress.textRead
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-white/5 border-white/10 text-gaming-textMuted'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${progress.textRead ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                {progress.textRead ? <Check size={20} /> : <FileText size={20} />}
                            </div>
                            <span className="font-medium text-sm">{t('lesson.text')}</span>
                        </div>
                    )}

                    {hasSlides && (
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${allSlidesViewed
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-white/5 border-white/10 text-gaming-textMuted'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allSlidesViewed ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                {allSlidesViewed ? <Check size={20} /> : <Presentation size={20} />}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-medium text-sm">{t('lesson.slides')}</span>
                                <span className="text-xs opacity-70">{viewedSlidesCount}/{totalSlides}</span>
                            </div>
                        </div>
                    )}

                    {hasTest && (
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${testStats?.isPassed
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-white/5 border-white/10 text-gaming-textMuted'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${testStats?.isPassed ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                {testStats?.isPassed ? <Check size={20} /> : <CheckCircle size={20} />}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-medium text-sm">{t('lesson.test')}</span>
                                {testStats && <span className="text-xs font-bold">{testStats.bestScore}%</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Детальная статистика теста (если есть) */}
            {testStats && (
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <RotateCcw size={18} className="text-gaming-gold" />
                        <div>
                            <div className="text-[10px] text-gaming-textMuted uppercase tracking-wider">{t('lesson.attempts')}</div>
                            <div className="font-bold text-white">{testStats.totalAttempts}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <Clock size={18} className="text-gaming-primary" />
                        <div>
                            <div className="text-[10px] text-gaming-textMuted uppercase tracking-wider">{t('lesson.lastAttempt')}</div>
                            <div className="font-bold text-white">
                                {testStats.lastAttemptAt ? new Intl.DateTimeFormat(lang === 'tj' ? 'tg-TJ' : 'ru-RU', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }).format(new Date(testStats.lastAttemptAt)) : '-'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(ProgressCard);
