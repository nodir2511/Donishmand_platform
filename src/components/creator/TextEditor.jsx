import React, { useState } from 'react';
import { Sparkles, FileText, Loader2 } from 'lucide-react';
import { translateText } from '../../services/translationService';

const TextEditor = ({ data, onChange, lang }) => {
    const [translating, setTranslating] = useState(false);

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleAutoTranslate = async () => {
        setTranslating(true);
        try {
            const translated = await translateText(data.bodyRu || '', 'ru', 'tj');
            handleChange('bodyTj', translated);
        } finally {
            setTranslating(false);
        }
    };

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gaming-accent flex items-center gap-2">
                <FileText size={20} />
                {lang === 'ru' ? 'Текстовый материал' : 'Матни дарсӣ'}
            </h4>

            {/* Text RU */}
            <div>
                <label className="block text-sm text-gaming-textMuted mb-2">
                    {lang === 'ru' ? 'Текст (RU)' : 'Матн (RU)'}
                </label>
                <textarea
                    value={data.bodyRu || ''}
                    onChange={(e) => handleChange('bodyRu', e.target.value)}
                    placeholder={lang === 'ru' ? 'Введите текст урока...' : 'Матни дарсро ворид кунед...'}
                    rows={8}
                    className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-primary/50 transition-colors resize-none"
                />
            </div>

            {/* Text TJ */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm text-gaming-textMuted mb-2">
                        {lang === 'ru' ? 'Текст (TJ)' : 'Матн (TJ)'}
                    </label>
                    <textarea
                        value={data.bodyTj || ''}
                        onChange={(e) => handleChange('bodyTj', e.target.value)}
                        placeholder={lang === 'ru' ? 'Матни дарсро ворид кунед...' : 'Матни дарсро ворид кунед...'}
                        rows={8}
                        className="w-full bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gaming-accent/50 transition-colors resize-none"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAutoTranslate}
                    disabled={translating}
                    className="mt-7 flex items-center gap-1 px-3 py-3 h-fit bg-gaming-accent/20 text-gaming-accent rounded-xl hover:bg-gaming-accent/30 transition-colors disabled:opacity-50"
                    title="Авто-перевод"
                >
                    {translating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
            </div>

            {/* Character count */}
            <div className="flex justify-between text-xs text-gaming-textMuted">
                <span>RU: {(data.bodyRu || '').length} {lang === 'ru' ? 'символов' : 'аломат'}</span>
                <span>TJ: {(data.bodyTj || '').length} {lang === 'ru' ? 'символов' : 'аломат'}</span>
            </div>
        </div>
    );
};

export default TextEditor;
