import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, ChevronLeft, ChevronRight, Presentation, Video, ClipboardList, AlertCircle, Eye, Check, Loader2 } from 'lucide-react';
import CourseLayout from '../layout/CourseLayout';
import VideoPlayer from '../viewer/VideoPlayer';
import TextContent from '../viewer/TextContent';
import ProgressCard from '../viewer/ProgressCard';
// import SlidesViewer from '../viewer/SlidesViewer';
// import TestViewer from '../viewer/TestViewer';
// import TestTeacherView from '../viewer/TestTeacherView';
const SlidesViewer = React.lazy(() => import('../viewer/SlidesViewer'));
const TestViewer = React.lazy(() => import('../viewer/TestViewer'));
const TestTeacherView = React.lazy(() => import('../viewer/TestTeacherView'));
import { syllabusService, studentService } from '../../services/apiService';
import { renderKatex } from '../../utils/katexRenderer';

// Ключи для отслеживания прогресса
const getProgressKey = (lessonId, type) => `progress_${lessonId}_${type}`;

import { useAuth } from '../../contexts/AuthContext';



const LessonPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const PASS_THRESHOLD = 80;

    const [loading, setLoading] = useState(true);
    const [lessonData, setLessonData] = useState(null); // { lesson, topic, section, subjectKey, ... }

    // Состояние прогресса
    const [progress, setProgress] = useState(() => ({
        videoWatched: localStorage.getItem(getProgressKey(lessonId, 'video')) === 'true',
        textRead: localStorage.getItem(getProgressKey(lessonId, 'text')) === 'true',
        slidesViewed: JSON.parse(localStorage.getItem(getProgressKey(lessonId, 'slides')) || '[]'),
        testHistory: JSON.parse(localStorage.getItem(`test_history_${lessonId}`) || '[]')
    }));

    const [activeTab, setActiveTab] = useState('video');
    const [showSlidesViewer, setShowSlidesViewer] = useState(false);
    const [showTestWarning, setShowTestWarning] = useState(false);
    const [showTestViewer, setShowTestViewer] = useState(false);

    // Определяем режим учителя
    const { user, isTeacher: rawIsTeacher, isAdmin } = useAuth();
    const isTeacher = rawIsTeacher || isAdmin; // Учитель, админ или суперадмин — не сохраняет прогресс

    // ЗАГРУЗКА ДАННЫХ И ПРОГРЕССА
    useEffect(() => {
        const fetchLessonData = async () => {
            setLoading(true);
            try {
                // 1. Получаем сам урок
                const lesson = await syllabusService.getLesson(lessonId, lang);

                if (!lesson) {
                    setLessonData(null);
                    setLoading(false);
                    return;
                }

                // 2. Получаем структуру предмета
                const subjectKey = lesson.subject;
                let contextData = null;

                if (subjectKey) {
                    const structure = await syllabusService.getStructure(subjectKey);

                    if (structure && structure.sections) {
                        for (let sIndex = 0; sIndex < structure.sections.length; sIndex++) {
                            const sec = structure.sections[sIndex];
                            if (!sec.topics) continue;
                            for (let tIndex = 0; tIndex < sec.topics.length; tIndex++) {
                                const top = sec.topics[tIndex];
                                if (!top.lessons) continue;
                                const lIndex = top.lessons.findIndex(l => l.id === lessonId);

                                if (lIndex !== -1) {
                                    contextData = {
                                        lesson: { ...lesson, ...top.lessons[lIndex], content: lesson.content },
                                        topic: top,
                                        section: sec,
                                        subjectKey,
                                        lessonIndex: lIndex,
                                        topicIndex: tIndex,
                                        sectionIndex: sIndex
                                    };
                                    break;
                                }
                            }
                            if (contextData) break;
                        }
                    }
                }

                setLessonData(contextData || { lesson, subjectKey });

                // 3. Загружаем прогресс с сервера для учеников
                if (!isTeacher) {
                    const userId = user?.id;
                    if (userId) {
                        // Прогресс по уроку
                        const progressData = await studentService.getLessonProgress(userId, lessonId);
                        // Результаты тестов
                        const testData = await studentService.getLessonTestResults(userId, lessonId);

                        if (progressData || testData) {
                            setProgress(prev => {
                                const newProgress = { ...prev };

                                if (progressData) {
                                    if (progressData.video_watched) newProgress.videoWatched = true;
                                    if (progressData.text_read) newProgress.textRead = true;

                                    // Для слайдов мы храним только количество, поэтому эмулируем просмотренные ID
                                    // Если просмотрено N слайдов, считаем массивом [0, 1, ... N]
                                    if (progressData.slides_viewed_count > 0 && lesson.content?.slidesRu) {
                                        const slides = lang === 'tj' ? lesson.content.slidesTj : lesson.content.slidesRu;
                                        const slidesToMock = Math.min(progressData.slides_viewed_count, progressData.total_slides || slides?.length || 0);
                                        // Локальное кэширование все равно работает по ID, так что смешиваем
                                        const mockIds = (slides || []).slice(0, slidesToMock).map(s => s.id);
                                        newProgress.slidesViewed = [...new Set([...prev.slidesViewed, ...mockIds])];
                                    }
                                }

                                if (testData && testData.length > 0) {
                                    // Конвертируем из БД в локальный формат для статистики
                                    const historyFromDb = testData.map(t => ({
                                        score: t.score,
                                        correct: t.correct_count,
                                        total: t.total_questions,
                                        timestamp: new Date(t.created_at).getTime(),
                                        passed: t.is_passed
                                    }));
                                    // Объединяем с локальной историей, чтобы не затереть то что только что сдали офлайн
                                    const merged = [...prev.testHistory, ...historyFromDb];
                                    // Убираем дубликаты по времени (примерно)
                                    const unique = Object.values(merged.reduce((acc, curr) => {
                                        // Округляем до секунды для дедупликации
                                        const key = Math.round(curr.timestamp / 1000);
                                        acc[key] = curr;
                                        return acc;
                                    }, {}));
                                    newProgress.testHistory = unique.sort((a, b) => a.timestamp - b.timestamp);
                                }

                                return newProgress;
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching lesson:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLessonData();
    }, [lessonId, lang, isTeacher, user?.id]);


    // Определение существующего контента
    const lessonContent = lessonData?.lesson?.content || {};
    // Видео (уже было с fallback)
    const videoUrl = lang === 'tj' ? (lessonContent.video?.urlTj || lessonContent.video?.url) : (lessonContent.video?.url || lessonContent.video?.urlTj);
    const hasVideo = !!videoUrl;

    // Текст с fallback
    const textTj = lessonContent.text?.bodyTj;
    const textRu = lessonContent.text?.bodyRu;
    const bodyText = lang === 'tj' ? (textTj || textRu) : (textRu || textTj);
    const hasText = !!bodyText;

    // Слайды с fallback
    const slidesTj = lessonContent.slidesTj || [];
    const slidesRu = lessonContent.slidesRu || [];
    const currentSlides = lang === 'tj'
        ? (slidesTj.length > 0 ? slidesTj : slidesRu)
        : (slidesRu.length > 0 ? slidesRu : slidesTj);
    const hasSlides = currentSlides.length > 0;

    const hasTest = lessonContent.test?.questions?.length > 0;
    const hasContent = hasVideo || hasText || hasSlides;
    const testQuestions = lessonContent.test?.questions || [];

    // Вычисление статистики
    const testStats = useMemo(() => {
        if (!progress.testHistory || progress.testHistory.length === 0) return null;

        const totalAttempts = progress.testHistory.length;
        const bestScore = Math.max(...progress.testHistory.map(h => h.score));

        // Средний процент ошибок = 100% - Средний балл
        const avgScore = progress.testHistory.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts;
        const avgErrorRate = Math.round(100 - avgScore);

        // Время последней попытки
        const lastAttemptAt = progress.testHistory[progress.testHistory.length - 1].timestamp;

        const isPassed = bestScore >= PASS_THRESHOLD;

        return { totalAttempts, bestScore, avgErrorRate, lastAttemptAt, isPassed };
    }, [progress.testHistory]);

    // Расчет прогресса
    const totalSlides = currentSlides.length;
    const viewedSlidesCount = progress.slidesViewed.length;
    const allSlidesViewed = totalSlides > 0 ? viewedSlidesCount >= totalSlides : true;

    const isVideoComplete = !hasVideo || progress.videoWatched;
    const isTextComplete = !hasText || progress.textRead;
    const isSlidesComplete = !hasSlides || allSlidesViewed;
    // Учитель всегда может пройти тест
    const canTakeTest = isTeacher || (isVideoComplete && isTextComplete && isSlidesComplete);

    // Расчет общего процента выполнения
    const totalSteps = [hasVideo, hasText, hasSlides, hasTest].filter(Boolean).length;
    let completedSteps = 0;
    if (hasVideo && progress.videoWatched) completedSteps++;
    if (hasText && progress.textRead) completedSteps++;
    if (hasSlides && allSlidesViewed) completedSteps++;
    if (hasTest && testStats?.isPassed) completedSteps++;

    const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const isLessonCompleted = completionPercentage === 100;

    // Установка начальной активной вкладки на основе доступного контента
    useEffect(() => {
        if (!loading && lessonData) {
            if (hasVideo) setActiveTab('video');
            else if (hasText) setActiveTab('text');
            else if (hasSlides) setActiveTab('slides');
        }
    }, [loading, hasVideo, hasText, hasSlides]);

    // Сохранение прогресса в БД (использует user из контекста, без лишнего getUser())
    const syncProgressToDb = async (updates) => {
        if (isTeacher) return;
        const userId = user?.id;
        if (!userId) return;
        try {
            await studentService.saveLessonProgress(userId, lessonId, updates);
        } catch (err) {
            console.error('Failed to sync progress:', err);
        }
    };

    // Пометить видео как просмотренное
    const handleVideoComplete = () => {
        if (isTeacher) return; // Учитель не сохраняет прогресс
        if (!progress.videoWatched) {
            localStorage.setItem(getProgressKey(lessonId, 'video'), 'true');
            setProgress(prev => ({ ...prev, videoWatched: true }));
            syncProgressToDb({ video_watched: true });
        }
    };

    // Пометить текст как прочитанный
    const handleTextRead = () => {
        if (isTeacher) return; // Учитель не сохраняет прогресс
        if (!progress.textRead) {
            localStorage.setItem(getProgressKey(lessonId, 'text'), 'true');
            setProgress(prev => ({ ...prev, textRead: true }));
            syncProgressToDb({ text_read: true });
        }
    };

    // Обновить прогресс просмотра слайдов
    const handleSlideView = (slideId) => {
        if (isTeacher) return; // Учитель не сохраняет прогресс
        const newViewed = [...new Set([...progress.slidesViewed, slideId])];
        localStorage.setItem(getProgressKey(lessonId, 'slides'), JSON.stringify(newViewed));
        setProgress(prev => ({ ...prev, slidesViewed: newViewed }));
        syncProgressToDb({
            slides_viewed_count: newViewed.length,
            total_slides: totalSlides
        });
    };

    // Обработка клика по кнопке теста
    const handleTestClick = () => {
        if (canTakeTest) {
            setShowTestViewer(true);
        } else {
            setShowTestWarning(true);
        }
    };

    // Обработка завершения теста
    const handleTestComplete = (results) => {
        // Обновляем историю в стейте, чтобы пересчитать статистику
        const newHistory = JSON.parse(localStorage.getItem(`test_history_${lessonId}`) || '[]');
        setProgress(prev => ({ ...prev, testHistory: newHistory }));
    };

    // Закрытие модальных окон по ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (showTestWarning) setShowTestWarning(false);
                if (showSlidesViewer) setShowSlidesViewer(false);
                // TestViewer имеет свой обработчик, но можно добавить и сюда для надежности,
                // если он не перехватывает фокус. Пока остановимся на warning и slides.
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showTestWarning, showSlidesViewer]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gaming-bg">
                <Loader2 size={40} className="text-gaming-primary animate-spin" />
            </div>
        );
    }

    if (!lessonData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gaming-bg">
                <h2 className="text-2xl mb-4">{t('lesson.notFound')}</h2>
                <button onClick={() => navigate(-1)} className="text-gaming-primary hover:underline">
                    {t('lesson.back')}
                </button>
            </div>
        );
    }

    const { lesson, topic, section, subjectKey, lessonIndex, sectionIndex, topicIndex } = lessonData;
    const getTitle = (item) => (lang === 'tj' && item.titleTj) ? item.titleTj : item.title;

    const prevLesson = topic?.lessons?.[lessonIndex - 1];
    const nextLesson = topic?.lessons?.[lessonIndex + 1];

    // Доступные вкладки на основе контента
    const availableTabs = [];
    if (hasVideo) availableTabs.push({ id: 'video', icon: Video, label: 'lesson.video', complete: progress.videoWatched });
    if (hasText) availableTabs.push({ id: 'text', icon: FileText, label: 'lesson.text', complete: progress.textRead });
    if (hasSlides) availableTabs.push({ id: 'slides', icon: Presentation, label: 'lesson.slides', complete: allSlidesViewed });

    return (
        <CourseLayout subjectId={subjectKey}>
            <div className="max-w-4xl">
                {/* Шапка */}
                <header className="mb-6">
                    <button
                        onClick={() => {
                            if (subjectKey && section?.id && topic?.id) {
                                navigate(`/subject/${subjectKey}/section/${section.id}/topic/${topic.id}`);
                            } else {
                                navigate(-1);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gaming-textMuted hover:text-white transition-all mb-4 group w-fit"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">{t('lesson.backToTopic')}</span>
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gaming-textMuted mb-1">
                                {t('lesson.lesson')} {lessonIndex + 1} / {topic?.lessons?.length || 0}
                            </p>
                            <h1 className="text-3xl font-bold mb-2 text-gaming-pink">
                                {lessonIndex + 1}. {getTitle(lesson)}
                            </h1>
                            {topic && (
                                <p className="text-gaming-textMuted flex items-center gap-2 text-sm">
                                    <span>{sectionIndex + 1}.{topicIndex + 1}. {getTitle(topic)}</span>
                                </p>
                            )}
                        </div>
                        {isTeacher && (
                            <div className="px-3 py-1 bg-gaming-pink text-white text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
                                {t('lesson.teacherMode')}
                            </div>
                        )}
                    </div>
                </header>

                {/* Карточка прогресса (Скрыта для учителя) */}
                {!isTeacher && (
                    <ProgressCard
                        hasVideo={hasVideo}
                        hasText={hasText}
                        hasSlides={hasSlides}
                        hasTest={hasTest}
                        progress={progress}
                        allSlidesViewed={allSlidesViewed}
                        viewedSlidesCount={viewedSlidesCount}
                        totalSlides={totalSlides}
                        testStats={testStats}
                        completedSteps={completedSteps}
                        totalSteps={totalSteps}
                        completionPercentage={completionPercentage}
                        lang={lang}
                    />
                )}

                {/* Контент существует - показываем вкладки и область контента */}
                {hasContent ? (
                    <>
                        {/* Вкладки контента */}
                        {availableTabs.length > 0 && (
                            <div className="flex gap-4 mb-6 border-b border-white/5 overflow-x-auto">
                                {availableTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`pb-3 px-2 text-base font-semibold transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gaming-textMuted hover:text-white'}`}
                                        >
                                            <Icon size={18} />
                                            {t(tab.label)}
                                            {tab.complete && !isTeacher && (
                                                <Check size={14} className="text-green-400" />
                                            )}
                                            {activeTab === tab.id && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gaming-pink rounded-t-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Область контента */}
                        <div className="bg-gaming-card/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 mb-6 shadow-xl overflow-hidden relative group">
                            <div className="absolute -left-20 -top-20 w-64 h-64 bg-gaming-pink/5 rounded-full blur-3xl group-hover:bg-gaming-pink/10 transition-all duration-700" />

                            <div className="relative z-10">
                                {activeTab === 'video' && hasVideo && (
                                    <VideoPlayer
                                        videoUrl={videoUrl}
                                        isVideoWatched={progress.videoWatched}
                                        isTeacher={isTeacher}
                                        onVideoComplete={handleVideoComplete}
                                    />
                                )}

                                {activeTab === 'text' && hasText && (
                                    <TextContent
                                        bodyText={bodyText}
                                        isTextRead={progress.textRead}
                                        isTeacher={isTeacher}
                                        onTextRead={handleTextRead}
                                    />
                                )}

                                {activeTab === 'slides' && hasSlides && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-gaming-textMuted">
                                                {viewedSlidesCount} / {totalSlides} {t('lesson.slidesCount')}
                                            </p>
                                            <button
                                                onClick={() => setShowSlidesViewer(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gaming-gold/20 text-gaming-gold rounded-xl hover:bg-gaming-gold/30 transition-colors"
                                            >
                                                <Presentation size={18} />
                                                {t('lesson.openPresentation')}
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {currentSlides.map((slide, idx) => (
                                                <button
                                                    key={slide.id}
                                                    onClick={() => {
                                                        handleSlideView(slide.id); // Отметить как просмотренное при клике
                                                        setShowSlidesViewer(true);
                                                    }}
                                                    className="relative w-full rounded-2xl overflow-hidden border border-white/5 hover:border-gaming-gold/30 transition-all group shadow-lg"
                                                >
                                                    <img src={slide.imageUrl} alt={`Slide ${idx + 1}`} className="w-full h-auto object-cover" />

                                                    {/* Наложение при наведении */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                        <div className="bg-black/60 p-3 rounded-full border border-white/20 transform scale-90 group-hover:scale-100 transition-transform">
                                                            <Presentation size={24} className="text-white" />
                                                        </div>
                                                    </div>

                                                    {/* Номер слайда */}
                                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-white font-bold text-sm border border-white/10">
                                                        {idx + 1}
                                                    </div>

                                                    {/* Индикатор просмотра */}
                                                    {(progress.slidesViewed.includes(slide.id) || isTeacher) && (
                                                        <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in">
                                                            <Check size={16} className="text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Нет контента - показываем только кнопку теста */
                    <div className="bg-gaming-card/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 mb-6 text-center">
                        <ClipboardList size={48} className="mx-auto mb-4 text-gaming-primary opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">
                            {t('lesson.testing')}
                        </h3>
                        <p className="text-gaming-textMuted mb-4">
                            {t('lesson.onlyTest')}
                        </p>
                    </div>
                )}

                {/* Модальное окно предупреждения перед тестом */}
                {showTestWarning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md bg-gaming-card/95 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6">
                            <div className="flex items-center gap-3 text-red-400 mb-4">
                                <AlertCircle size={24} />
                                <h3 className="text-lg font-semibold">
                                    {t('lesson.reviewMaterialsTitle')}
                                </h3>
                            </div>
                            <p className="text-gaming-textMuted mb-4">
                                {t('lesson.reviewMaterialsText')}
                            </p>
                            <ul className="space-y-2 mb-6">
                                {hasVideo && (
                                    <li className={`flex items-center gap-2 ${progress.videoWatched ? 'text-green-400' : 'text-red-400'}`}>
                                        {progress.videoWatched ? <Check size={16} /> : <AlertCircle size={16} />}
                                        {t('lesson.video')}
                                    </li>
                                )}
                                {hasText && (
                                    <li className={`flex items-center gap-2 ${progress.textRead ? 'text-green-400' : 'text-red-400'}`}>
                                        {progress.textRead ? <Check size={16} /> : <AlertCircle size={16} />}
                                        {t('lesson.text')}
                                    </li>
                                )}
                                {hasSlides && (
                                    <li className={`flex items-center gap-2 ${allSlidesViewed ? 'text-green-400' : 'text-red-400'}`}>
                                        {allSlidesViewed ? <Check size={16} /> : <AlertCircle size={16} />}
                                        {t('lesson.slides')} ({viewedSlidesCount}/{totalSlides})
                                    </li>
                                )}
                            </ul>
                            <button
                                onClick={() => setShowTestWarning(false)}
                                className="w-full px-4 py-3 bg-gaming-primary text-white rounded-xl hover:bg-gaming-primary/80 transition-colors"
                            >
                                {t('lesson.understood')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Навигация и действия */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex gap-2">
                        {prevLesson && (
                            <button
                                onClick={() => navigate(`/lesson/${prevLesson.id}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gaming-textMuted hover:text-white transition-colors text-sm"
                            >
                                <ChevronLeft size={16} />
                                <span className="hidden sm:inline">{t('lesson.prev')}</span>
                            </button>
                        )}
                        {nextLesson && (
                            <button
                                onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gaming-textMuted hover:text-white transition-colors text-sm"
                            >
                                <span className="hidden sm:inline">{t('lesson.next')}</span>
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleTestClick}
                        className={`group font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg border border-white/10 ${canTakeTest
                            ? isTeacher ? 'bg-gaming-pink hover:bg-gaming-pink/80 text-white shadow-gaming-pink/25' : 'bg-gaming-primary hover:bg-gaming-primary/80 text-white shadow-gaming-primary/25'
                            : 'bg-gaming-card/60 text-gaming-textMuted cursor-not-allowed'
                            }`}
                    >
                        {isTeacher ? <Eye size={20} /> : <CheckCircle size={20} />}
                        <span>
                            {isTeacher
                                ? t('lesson.viewTest')
                                : t('lesson.takeTest')
                            }
                        </span>
                        {!canTakeTest && <AlertCircle size={16} className="text-yellow-400" />}
                    </button>
                </div>

            </div>

            {/* Окна просмотра (слайды, тесты) - Lazy Loaded */}
            <React.Suspense fallback={
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <Loader2 size={40} className="text-gaming-primary animate-spin" />
                </div>
            }>
                {showSlidesViewer && hasSlides && (
                    <SlidesViewer
                        slides={currentSlides}
                        lessonId={lessonId}
                        onClose={() => setShowSlidesViewer(false)}
                        onSlideView={handleSlideView}
                    />
                )}

                {showTestViewer && (
                    isTeacher ? (
                        <TestTeacherView
                            questions={testQuestions}
                            lang={lang}
                            onClose={() => setShowTestViewer(false)}
                        />
                    ) : (
                        <TestViewer
                            questions={testQuestions}
                            lessonId={lessonId}
                            lang={lang}
                            onClose={() => setShowTestViewer(false)}
                            onComplete={handleTestComplete}
                        />
                    )
                )}
            </React.Suspense>
        </CourseLayout >
    );
};

export default LessonPage;
