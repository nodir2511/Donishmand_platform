import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, Image as ImageIcon, X, Check, List, ArrowLeftRight, Hash } from 'lucide-react';
import { translateText } from '../../../services/translationService';
import { supabase } from '../../../services/supabase';
import RichTextEditor from '../RichTextEditor';

const UNITS = ['', 'м', 'см', 'мм', 'км', 'м²', 'см²', 'м³', 'кг', 'г', 'л', 'мл', 'с', 'мин', 'ч', '°', '°C', '%', 'Н', 'Дж', 'Вт'];

const QuestionForm = ({ question: initialQuestion, onSave, onCancel }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';

    // Local state for the form with legacy data support
    const [q, setQ] = useState(() => {
        const stripHtmlTags = (val) => val ? val.toString().replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';
        const isNumeric = (val) => { const s = stripHtmlTags(val); return s !== '' && /^\d+$/.test(s); };
        const getValidLegacyText = (qObj) => {
            if (!qObj) return '';
            // Проверяем все возможные поля на наличие нечислового текста
            const variants = [qObj.question, qObj.text, qObj.title];
            for (const v of variants) {
                if (v && !isNumeric(v)) return v;
            }
            return '';
        };

        // Migration for main question
        const base = {
            ...initialQuestion,
            textRu: initialQuestion.textRu || getValidLegacyText(initialQuestion),
            textTj: initialQuestion.textTj ?? '',
            imageRu: initialQuestion.imageRu ?? initialQuestion.image ?? null,
            imageTj: initialQuestion.imageTj ?? null,
        };

        // Migration for options
        if (base.options) {
            base.options = base.options.map(opt => ({
                ...opt,
                textRu: opt.textRu || getValidLegacyText(opt),
                textTj: opt.textTj ?? '',
                imageRu: opt.imageRu ?? opt.image ?? null,
                imageTj: opt.imageTj ?? null,
            }));
        }

        // Migration for matching leftItems
        if (base.leftItems) {
            base.leftItems = base.leftItems.map(item => ({
                ...item,
                textRu: item.textRu || getValidLegacyText(item),
                textTj: item.textTj ?? '',
                imageRu: item.imageRu ?? item.image ?? null,
                imageTj: item.imageTj ?? null,
            }));
        }

        // Migration for matching rightItems
        if (base.rightItems) {
            base.rightItems = base.rightItems.map(item => ({
                ...item,
                textRu: item.textRu || getValidLegacyText(item),
                textTj: item.textTj ?? '',
                imageRu: item.imageRu ?? item.image ?? null,
                imageTj: item.imageTj ?? null,
            }));
        }

        return base;
    });
    const [translating, setTranslating] = useState({});
    const [uploading, setUploading] = useState(false);

    // --- Helpers ---
    const updateField = (field, value) => setQ(prev => ({ ...prev, [field]: value }));

    // --- Options Helper ---
    const updateOption = (idx, field, value) => {
        const newOptions = [...q.options];
        newOptions[idx] = { ...newOptions[idx], [field]: value };
        updateField('options', newOptions);
    };

    // --- Matching Helpers ---
    const updateLeftItem = (idx, field, value) => {
        const newItems = [...q.leftItems];
        newItems[idx] = { ...newItems[idx], [field]: value };
        updateField('leftItems', newItems);
    };

    const updateRightItem = (idx, field, value) => {
        const newItems = [...q.rightItems];
        newItems[idx] = { ...newItems[idx], [field]: value };
        updateField('rightItems', newItems);
    };

    const updateMatch = (leftId, rightId) => {
        updateField('correctMatches', { ...q.correctMatches, [leftId]: rightId });
    };

    // --- Numeric Helpers ---
    const updateDigit = (idx, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;
        const newDigits = [...q.digits];
        newDigits[idx] = value;
        updateField('digits', newDigits);
    };

    // --- Auto-Translate ---
    const handleTranslate = async (text, direction, fieldPath) => {
        const key = fieldPath.join('_');
        setTranslating(prev => ({ ...prev, [key]: true }));
        try {
            const translated = await translateText(text, direction === 'ru_tj' ? 'ru' : 'tj', direction === 'ru_tj' ? 'tj' : 'ru');
            // Helper to set nested value
            if (fieldPath.length === 1) {
                updateField(fieldPath[0], translated);
            } else if (fieldPath[0] === 'options') {
                updateOption(fieldPath[1], fieldPath[2], translated);
            } else if (fieldPath[0] === 'leftItems') {
                updateLeftItem(fieldPath[1], fieldPath[2], translated);
            } else if (fieldPath[0] === 'rightItems') {
                updateRightItem(fieldPath[1], fieldPath[2], translated);
            }
        } finally {
            setTranslating(prev => ({ ...prev, [key]: false }));
        }
    };

    // --- Image Upload ---
    const handleImageUpload = async (file, callback) => {
        if (!file) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            callback(data.publicUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('creator.uploadError'));
        } finally {
            setUploading(false);
        }
    };

    const ImageUploader = ({ image, onUpload, onRemove, size = 'md' }) => {
        const fileInputRef = React.useRef(null);

        if (image) {
            return (
                <div className={`relative group ${size === 'sm' ? 'w-10 h-10' : 'w-full h-32'} bg-gaming-card/50 rounded-lg border border-white/10 overflow-hidden`}>
                    <img src={image} alt="Uploaded" className="w-full h-full object-cover" />
                    <button onClick={onRemove} className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                </div>
            );
        }
        return (
            <>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], onUpload)} disabled={uploading} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`flex items-center justify-center ${size === 'sm' ? 'w-10 h-10' : 'w-full h-10'} bg-gaming-bg/30 border border-white/10 rounded-lg hover:bg-gaming-bg/50 transition-colors`}>
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                </button>
            </>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gaming-card max-h-[85vh] w-full max-w-4xl mx-auto rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <h3 className="text-lg font-bold text-gaming-primary flex items-center gap-2">
                    {q.id.startsWith('new_') ? t('creator.addQuestion') : t('creator.editQuestion')}
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-gaming-textMuted font-normal border border-white/5">
                        {t(`creator.${q.type === 'multiple_choice' ? 'singleChoice' : q.type}`)}
                    </span>
                </h3>
                <button onClick={onCancel} className="p-2 text-gaming-textMuted hover:text-white transition-colors rounded-lg hover:bg-white/5">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Main Question Image (RU & TJ) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <span className="text-xs font-medium text-gaming-textMuted ml-1">{t('creator.imageRu')}</span>
                        <ImageUploader image={q.imageRu} onUpload={(url) => updateField('imageRu', url)} onRemove={() => updateField('imageRu', null)} size="lg" />
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs font-medium text-gaming-textMuted ml-1">{t('creator.imageTj')}</span>
                        <ImageUploader image={q.imageTj} onUpload={(url) => updateField('imageTj', url)} onRemove={() => updateField('imageTj', null)} size="lg" />
                    </div>
                </div>

                {/* Question Text (RU & TJ) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-gaming-textMuted ml-1">{t('creator.questionTextRu')}</label>
                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <RichTextEditor content={q.textRu} onChange={(val) => updateField('textRu', val)} placeholder={t('creator.enterQuestionText')} minimal={true} minHeight="80px" />
                            </div>
                            <button onClick={() => handleTranslate(q.textRu, 'ru_tj', ['textTj'])} disabled={translating['textTj']} className="mt-2 p-2 bg-gaming-accent/20 text-gaming-accent rounded-lg hover:bg-gaming-accent/30 disabled:opacity-50">
                                {translating['textTj'] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gaming-textMuted ml-1">{t('creator.questionTextTj')}</label>
                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <RichTextEditor content={q.textTj} onChange={(val) => updateField('textTj', val)} placeholder={t('creator.enterQuestionText')} minimal={true} minHeight="80px" />
                            </div>
                            <button onClick={() => handleTranslate(q.textTj, 'tj_ru', ['textRu'])} disabled={translating['textRu']} className="mt-2 p-2 bg-gaming-primary/20 text-gaming-primary rounded-lg hover:bg-gaming-primary/30 disabled:opacity-50">
                                {translating['textRu'] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="rotate-180" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- TYPE SPECIFIC CONTENT --- */}
                <div className="pt-4 border-t border-white/5">
                    {/* Multiple Choice */}
                    {q.type === 'multiple_choice' && (
                        <div className="space-y-3">
                            <span className="text-sm font-medium text-gaming-textMuted block mb-2">{t('creator.answerOptions')}</span>
                            {q.options.map((opt, idx) => (
                                <div key={opt.id} className="flex items-center gap-2 group">
                                    <button
                                        onClick={() => updateField('correctId', opt.id)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${q.correctId === opt.id ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' : 'bg-gaming-bg/30 text-gaming-textMuted hover:bg-white/5'
                                            }`}
                                    >
                                        {q.correctId === opt.id ? <Check size={16} /> : <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>}
                                    </button>

                                    <input
                                        type="text" value={opt.textRu} onChange={(e) => updateOption(idx, 'textRu', e.target.value)}
                                        placeholder="RU options"
                                        className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gaming-primary/50 outline-none"
                                    />
                                    <button onClick={() => handleTranslate(opt.textRu, 'ru_tj', ['options', idx, 'textTj'])} disabled={translating[`options_${idx}_textTj`]} className="p-2 bg-gaming-accent/10 text-gaming-accent rounded-lg hover:bg-gaming-accent/20">
                                        {translating[`options_${idx}_textTj`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    </button>
                                    <input
                                        type="text" value={opt.textTj} onChange={(e) => updateOption(idx, 'textTj', e.target.value)}
                                        placeholder="TJ options"
                                        className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gaming-accent/50 outline-none"
                                    />
                                    <div className="flex flex-col gap-1 items-center">
                                        <ImageUploader image={opt.imageRu} onUpload={(url) => updateOption(idx, 'imageRu', url)} onRemove={() => updateOption(idx, 'imageRu', null)} size="sm" />
                                        <span className="text-[10px] text-gaming-textMuted">RU</span>
                                    </div>
                                    <div className="flex flex-col gap-1 items-center">
                                        <ImageUploader image={opt.imageTj} onUpload={(url) => updateOption(idx, 'imageTj', url)} onRemove={() => updateOption(idx, 'imageTj', null)} size="sm" />
                                        <span className="text-[10px] text-gaming-textMuted">TJ</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Matching */}
                    {q.type === 'matching' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-gaming-textMuted uppercase tracking-wider">{t('creator.leftColumn')}</span>
                                    {q.leftItems.map((item, idx) => (
                                        <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gaming-pink w-6 text-center">{item.id}</span>
                                                <input type="text" value={item.textRu} onChange={(e) => updateLeftItem(idx, 'textRu', e.target.value)} placeholder="RU" className="flex-1 bg-gaming-bg/50 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-gaming-pink/50" />
                                            </div>
                                            <div className="flex items-center gap-2 pl-8">
                                                <input type="text" value={item.textTj} onChange={(e) => updateLeftItem(idx, 'textTj', e.target.value)} placeholder="TJ" className="flex-1 bg-gaming-bg/50 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-gaming-accent/50" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleTranslate(item.textRu, 'ru_tj', ['leftItems', idx, 'textTj'])} disabled={translating[`leftItems_${idx}_textTj`]} className="p-1.5 bg-gaming-accent/10 text-gaming-accent rounded hover:bg-gaming-accent/20 h-10">
                                                        {translating[`leftItems_${idx}_textTj`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    </button>
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <ImageUploader image={item.imageRu} onUpload={(url) => updateLeftItem(idx, 'imageRu', url)} onRemove={() => updateLeftItem(idx, 'imageRu', null)} size="sm" />
                                                        <span className="text-[10px] text-gaming-textMuted">RU</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <ImageUploader image={item.imageTj} onUpload={(url) => updateLeftItem(idx, 'imageTj', url)} onRemove={() => updateLeftItem(idx, 'imageTj', null)} size="sm" />
                                                        <span className="text-[10px] text-gaming-textMuted">TJ</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Right Column */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-gaming-textMuted uppercase tracking-wider">{t('creator.rightColumn')}</span>
                                    {q.rightItems.map((item, idx) => (
                                        <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gaming-accent w-6 text-center">{item.id}</span>
                                                <input type="text" value={item.textRu} onChange={(e) => updateRightItem(idx, 'textRu', e.target.value)} placeholder="RU" className="flex-1 bg-gaming-bg/50 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-gaming-primary/50" />
                                            </div>
                                            <div className="flex items-center gap-2 pl-8">
                                                <input type="text" value={item.textTj} onChange={(e) => updateRightItem(idx, 'textTj', e.target.value)} placeholder="TJ" className="flex-1 bg-gaming-bg/50 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-gaming-accent/50" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleTranslate(item.textRu, 'ru_tj', ['rightItems', idx, 'textTj'])} disabled={translating[`rightItems_${idx}_textTj`]} className="p-1.5 bg-gaming-accent/10 text-gaming-accent rounded hover:bg-gaming-accent/20 h-10">
                                                        {translating[`rightItems_${idx}_textTj`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    </button>
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <ImageUploader image={item.imageRu} onUpload={(url) => updateRightItem(idx, 'imageRu', url)} onRemove={() => updateRightItem(idx, 'imageRu', null)} size="sm" />
                                                        <span className="text-[10px] text-gaming-textMuted">RU</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <ImageUploader image={item.imageTj} onUpload={(url) => updateRightItem(idx, 'imageTj', url)} onRemove={(url) => updateRightItem(idx, 'imageTj', null)} size="sm" />
                                                        <span className="text-[10px] text-gaming-textMuted">TJ</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Matching Grid */}
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <span className="text-sm font-semibold text-white block mb-4 text-center">{t('creator.correctMatchesGrid')}</span>
                                <div className="overflow-x-auto flex justify-center">
                                    <table className="border-separate border-spacing-2">
                                        <thead>
                                            <tr>
                                                <th className="w-8"></th>
                                                {q.rightItems.map(r => <th key={r.id} className="text-center font-bold text-gaming-accent text-sm pb-2">{r.id}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {q.leftItems.map(l => (
                                                <tr key={l.id}>
                                                    <td className="text-center font-bold text-gaming-pink text-sm pr-2">{l.id}</td>
                                                    {q.rightItems.map(r => {
                                                        const isCorrect = q.correctMatches[l.id] === r.id;
                                                        return (
                                                            <td key={r.id} className="text-center p-0.5">
                                                                <button onClick={() => updateMatch(l.id, r.id)} className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${isCorrect ? 'bg-gaming-primary border-gaming-primary shadow-[0_0_8px_rgba(var(--gaming-primary-rgb),0.5)]' : 'bg-white/5 border-white/20 hover:border-white/40'}`}>
                                                                    {isCorrect && <div className="w-3 h-3 bg-white rounded-full" />}
                                                                </button>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Numeric */}
                    {q.type === 'numeric' && (
                        <div className="space-y-4">
                            <span className="text-sm font-medium text-gaming-textMuted">{t('creator.enterCorrectAnswer')}</span>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2">
                                    {q.digits.map((digit, idx) => (
                                        <input key={idx} type="text" value={digit} onChange={(e) => updateDigit(idx, e.target.value)} maxLength={1} className="w-12 h-14 text-center text-2xl font-bold bg-gaming-bg/50 border-2 border-white/20 rounded-xl text-white outline-none focus:border-gaming-primary transition-colors" placeholder="0" />
                                    ))}
                                </div>
                                <select value={q.unit || ''} onChange={(e) => updateField('unit', e.target.value)} className="bg-gaming-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gaming-primary/50">
                                    {UNITS.map(u => <option key={u} value={u}>{u || t('creator.noUnit')}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={onCancel} className="px-5 py-2.5 text-gaming-textMuted hover:text-white transition-colors">{t('creator.cancel')}</button>
                <button onClick={() => onSave(q)} className="px-6 py-2.5 bg-gaming-primary text-white rounded-xl hover:bg-gaming-primary/80 transition-colors shadow-lg shadow-gaming-primary/20 font-medium">
                    {t('creator.saveQuestion')}
                </button>
            </div>
        </div>
    );
};

export default QuestionForm;
