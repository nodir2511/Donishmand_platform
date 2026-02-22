import React, { useState } from 'react';
import { Sparkles, FileText, Loader2 } from 'lucide-react';
import { translateText } from '../../services/translationService';
import RichTextEditor from './RichTextEditor';

const TextEditor = ({ data, onChange, lang }) => {
    const [translating, setTranslating] = useState(false);

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleAutoTranslateTjToRu = async () => {
        setTranslating(true);
        try {
            const translated = await translateText(data.bodyTj || '', 'tj', 'ru');
            handleChange('bodyRu', translated);
        } finally {
            setTranslating(false);
        }
    };

    const handleAutoTranslateRuToTj = async () => {
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

            {/* Текст RU */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm text-gaming-textMuted mb-2">
                        {lang === 'ru' ? 'Текст (RU)' : 'Матн (RU)'}
                    </label>
                    <RichTextEditor
                        content={data.bodyRu || ''}
                        onChange={(content) => handleChange('bodyRu', content)}
                        placeholder={lang === 'ru' ? 'Введите текст урока...' : 'Матни дарсро ворид кунед...'}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAutoTranslateTjToRu}
                    disabled={translating}
                    className="mt-7 flex items-center gap-1 px-3 py-3 h-fit bg-gaming-primary/20 text-gaming-primary rounded-xl hover:bg-gaming-primary/30 transition-colors disabled:opacity-50"
                    title="Перевести TJ -> RU"
                >
                    {translating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="rotate-180" />}
                </button>
            </div>

            {/* Текст TJ */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm text-gaming-textMuted mb-2">
                        {lang === 'ru' ? 'Текст (TJ)' : 'Матн (TJ)'}
                    </label>
                    <RichTextEditor
                        content={data.bodyTj || ''}
                        onChange={(content) => handleChange('bodyTj', content)}
                        placeholder={lang === 'ru' ? 'Матни дарсро ворид кунед...' : 'Матни дарсро ворид кунед...'}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAutoTranslateRuToTj}
                    disabled={translating}
                    className="mt-7 flex items-center gap-1 px-3 py-3 h-fit bg-gaming-accent/20 text-gaming-accent rounded-xl hover:bg-gaming-accent/30 transition-colors disabled:opacity-50"
                    title="Перевести RU -> TJ"
                >
                    {translating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
            </div>

            {/* Количество символов */}
            <div className="flex justify-between text-xs text-gaming-textMuted">
                <span>RU: {(data.bodyRu || '').length} {lang === 'ru' ? 'символов' : 'аломат'}</span>
                <span>TJ: {(data.bodyTj || '').length} {lang === 'ru' ? 'символов' : 'аломат'}</span>
            </div>
        </div>
    );
};

export default TextEditor;
