import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Maximize2, Check } from 'lucide-react';

const SlidesViewer = ({ slides, lessonId, onClose, onSlideView }) => {
    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const containerRef = React.useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewedSlides, setViewedSlides] = useState(() => {
        const stored = localStorage.getItem(`viewed_slides_${lessonId}`);
        return stored ? JSON.parse(stored) : [];
    });

    const currentSlide = slides[currentIndex];

    // Пометить слайд как просмотренный
    useEffect(() => {
        if (currentSlide && !viewedSlides.includes(currentSlide.id)) {
            const newViewed = [...viewedSlides, currentSlide.id];
            setViewedSlides(newViewed);
            localStorage.setItem(`viewed_slides_${lessonId}`, JSON.stringify(newViewed));
            if (onSlideView) onSlideView(currentSlide.id);
        }
    }, [currentIndex, currentSlide, viewedSlides, lessonId, onSlideView]);

    // Навигация с клавиатуры
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
            setCurrentIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'Escape') {
            if (isFullscreen) setIsFullscreen(false);
            else onClose();
        } else if (e.key === 'f' || e.key === 'F') {
            setIsFullscreen(prev => !prev);
        }
    }, [slides.length, isFullscreen, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Синхронизация с Fullscreen API
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Попытка автоматического входа в полноэкранный режим при открытии
        if (containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.log('Auto-fullscreen blocked:', err);
                // Если авто-блокировка, мы все равно показываем UI, но isFullscreen будет false
            });
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log('Exit fullscreen error:', err));
            }
        };
    }, []);

    // Поддержка касаний/свайпов
    const [touchStart, setTouchStart] = useState(null);

    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (!touchStart) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentIndex < slides.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else if (diff < 0 && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            }
        }
        setTouchStart(null);
    };

    const goToPrev = () => setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
    const goToNext = () => setCurrentIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen().catch(err => console.log(err));
        }
    };

    const containerClass = isFullscreen
        ? 'fixed inset-0 z-[100] bg-black'
        : 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4';

    const imageContainerClass = isFullscreen
        ? 'w-full h-full flex items-center justify-center'
        : 'w-full max-w-5xl max-h-[80vh] flex items-center justify-center';

    return (
        <div
            ref={containerRef}
            className={containerClass}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Шапка */}
            {!isFullscreen && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-white/70 text-sm">
                            {currentIndex + 1} / {slides.length}
                        </span>
                        {viewedSlides.includes(currentSlide?.id) && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                <Check size={12} />
                                {lang === 'ru' ? 'Просмотрено' : 'Дида шуд'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            title="Fullscreen (F)"
                        >
                            <Maximize2 size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Шапка полноэкранного режима */}
            {isFullscreen && (
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={onClose}
                        className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            )}

            {/* Основной контент */}
            <div className={imageContainerClass}>
                {currentSlide && (
                    <img
                        src={currentSlide.imageUrl}
                        alt={lang === 'tj' ? (currentSlide.captionTj || currentSlide.captionRu) : currentSlide.captionRu}
                        className={isFullscreen ? 'max-w-full max-h-full object-contain' : 'max-w-full max-h-[70vh] object-contain rounded-lg'}
                    />
                )}
            </div>

            {/* Описание */}
            {!isFullscreen && currentSlide && (currentSlide.captionRu || currentSlide.captionTj) && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl text-center">
                    <p className="text-white/90 text-lg bg-black/50 px-6 py-3 rounded-xl backdrop-blur-sm">
                        {lang === 'tj' ? (currentSlide.captionTj || currentSlide.captionRu) : currentSlide.captionRu}
                    </p>
                </div>
            )}

            {/* Стрелки навигации */}
            <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${currentIndex === 0
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={goToNext}
                disabled={currentIndex === slides.length - 1}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${currentIndex === slides.length - 1
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
            >
                <ChevronRight size={32} />
            </button>

            {/* Индикатор в виде точек */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                            ? 'bg-white w-4'
                            : viewedSlides.includes(slide.id)
                                ? 'bg-green-500/70 hover:bg-green-500'
                                : 'bg-white/30 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>

            {/* Прогресс-бар */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div
                    className="h-full bg-gaming-primary transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                />
            </div>
        </div>
    );
};

export default SlidesViewer;
