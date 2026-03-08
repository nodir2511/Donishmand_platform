import React, { useState } from 'react';
import { Sparkles, Video, Link, Loader2 } from 'lucide-react';
import { translationService } from '../../services/apiService';

const VideoEditor = ({ data, onChange, lang }) => {
    const [translating, setTranslating] = useState(false);

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleAutoTranslateDesc = async () => {
        setTranslating(true);
        try {
            const translated = await translationService.translateText(data.descriptionRu || '', 'ru', 'tj');
            handleChange('descriptionTj', translated);
        } finally {
            setTranslating(false);
        }
    };

    const handleAutoTranslateDescTjToRu = async () => {
        setTranslating(true);
        try {
            const translated = await translationService.translateText(data.descriptionTj || '', 'tj', 'ru');
            handleChange('descriptionRu', translated);
        } finally {
            setTranslating(false);
        }
    };

    const handleCopyUrl = () => {
        handleChange('urlTj', data.url || '');
    };

    return (
        <div className="space-y-5">
            <h4 className="text-lg font-semibold text-gaming-primary flex items-center gap-2">
                <Video size={20} />
                {lang === 'ru' ? 'Видеоматериал' : 'Видеоматериал'}
            </h4>

            {/* URL видео (RU) */}
            <div>
                <label className="block text-sm text-gaming-textMuted mb-2 flex items-center gap-2">
                    <Link size={14} />
                    {lang === 'ru' ? 'Ссылка на видео (RU)' : 'Пайванд ба видео (RU)'}
                </label>
                <div className="relative">
                    <input
                        type="url"
                        value={data.url || ''}
                        onChange={(e) => handleChange('url', e.target.value)}
                        placeholder="https://youtube.com/..."
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-primary/50 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">RU</span>
                </div>
            </div>

            {/* URL видео (TJ) */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm text-gaming-textMuted mb-2 flex items-center gap-2">
                        <Link size={14} />
                        {lang === 'ru' ? 'Ссылка на видео (TJ)' : 'Пайванд ба видео (TJ)'}
                    </label>
                    <div className="relative">
                        <input
                            type="url"
                            value={data.urlTj || ''}
                            onChange={(e) => handleChange('urlTj', e.target.value)}
                            placeholder="https://youtube.com/..."
                            className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-accent/50 transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">TJ</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="mt-7 flex items-center gap-1 px-3 py-3 h-fit bg-gaming-accent/20 text-gaming-accent rounded-xl hover:bg-gaming-accent/30 transition-colors"
                    title={lang === 'ru' ? 'Копировать ссылку' : 'Нусхабардорӣ'}
                >
                    <Sparkles size={16} />
                </button>
            </div>

            <div className="border-t border-white/5 pt-4" />

            {/* Описание (RU) */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm text-gaming-textMuted mb-2">
                        {lang === 'ru' ? 'Описание видео (RU)' : 'Тавсифи видео (RU)'}
                    </label>
                    <textarea
                        value={data.descriptionRu || ''}
                        onChange={(e) => handleChange('descriptionRu', e.target.value)}
                        placeholder={lang === 'ru' ? 'Краткое описание видео...' : 'Тавсифи мухтасар...'}
                        rows={3}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-primary/50 transition-colors resize-none"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAutoTranslateDescTjToRu}
                    disabled={translating}
                    className="mt-7 flex items-center gap-1 px-3 py-3 h-fit bg-gaming-primary/20 text-gaming-primary rounded-xl hover:bg-gaming-primary/30 transition-colors disabled:opacity-50"
                    title="Перевести TJ -> RU"
                >
                    {translating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="rotate-180" />}
                </button>
            </div>

            {/* Описание (TJ) */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm text-gaming-textMuted mb-2">
                        {lang === 'ru' ? 'Описание видео (TJ)' : 'Тавсифи видео (TJ)'}
                    </label>
                    <textarea
                        value={data.descriptionTj || ''}
                        onChange={(e) => handleChange('descriptionTj', e.target.value)}
                        placeholder={lang === 'ru' ? 'Тавсифи мухтасар...' : 'Тавсифи мухтасар...'}
                        rows={3}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-accent/50 transition-colors resize-none"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAutoTranslateDesc}
                    disabled={translating}
                    className="mt-7 flex items-center gap-1 px-3 py-3 h-fit bg-gaming-accent/20 text-gaming-accent rounded-xl hover:bg-gaming-accent/30 transition-colors disabled:opacity-50"
                    title="Перевести RU -> TJ"
                >
                    {translating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
            </div>

            {/* Подсказка для предпросмотра */}
            {(data.url || data.urlTj) && (
                <div className="bg-gaming-card/30 rounded-xl p-3 text-sm text-gaming-textMuted">
                    <span className="text-gaming-primary font-medium">💡 </span>
                    {lang === 'ru'
                        ? 'Видео будет отображаться при просмотре урока'
                        : 'Видео ҳангоми дидани дарс намоиш дода мешавад'}
                </div>
            )}
        </div>
    );
};

export default VideoEditor;
