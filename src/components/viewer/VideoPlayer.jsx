import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';

// Компонент видеоплеера уроков
const VideoPlayer = ({ videoUrl, isVideoWatched, isTeacher, onVideoComplete }) => {
    const { t } = useTranslation();

    return (
        <div className="aspect-video bg-black/60 rounded-xl flex flex-col items-center justify-center border border-white/10 shadow-inner overflow-hidden relative">
            {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (() => {
                // Извлекаем ID видео с поддержкой разных форматов (youtu.be, ?v=, &v=)
                const videoIdMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?]*)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;

                return videoId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        title={t('videoPlayerTitle', 'YouTube video player')}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="text-white text-center p-4">
                        <p>{t('videoLoadError')}</p>
                        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-gaming-primary hover:underline mt-2 inline-block">
                            {t('openOnYoutube')}
                        </a>
                    </div>
                );
            })() : (
                <video
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                    onEnded={onVideoComplete}
                    onPlay={() => setTimeout(onVideoComplete, 30000)}
                />
            )}
            {!isVideoWatched && !isTeacher && (
                <button
                    onClick={onVideoComplete}
                    className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                >
                    <Eye size={16} />
                    {t('lesson.markAsWatched')}
                </button>
            )}
        </div>
    );
};

export default React.memo(VideoPlayer);
