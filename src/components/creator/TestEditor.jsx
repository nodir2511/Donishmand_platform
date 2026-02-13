import React, { useState } from 'react';
import { Sparkles, ClipboardList, Plus, Trash2, Check, List, ArrowLeftRight, Hash, ChevronDown, Loader2 } from 'lucide-react';
import { translateText } from '../../services/translationService';

const QUESTION_TYPES = [
    { id: 'multiple_choice', icon: List, label: { ru: '4 варианта ответа', tj: '4 вариант ҷавоб' } },
    { id: 'matching', icon: ArrowLeftRight, label: { ru: 'Соответствия', tj: 'Мувофиқат' } },
    { id: 'numeric', icon: Hash, label: { ru: 'Числовой ответ', tj: 'Ҷавоби рақамӣ' } },
];

const UNITS = ['', 'м', 'см', 'мм', 'км', 'м²', 'см²', 'м³', 'кг', 'г', 'л', 'мл', 'с', 'мин', 'ч', '°', '°C', '%', 'Н', 'Дж', 'Вт'];

const TestEditor = ({ data, onChange, lang }) => {
    const questions = data.questions || [];
    const [translating, setTranslating] = useState({});

    const addQuestion = (type = 'multiple_choice') => {
        let newQuestion = {
            id: `q_${Date.now()}`,
            type,
            textRu: '',
            textTj: '',
        };

        if (type === 'multiple_choice') {
            newQuestion.options = [
                { id: `opt_${Date.now()}_1`, textRu: '', textTj: '' },
                { id: `opt_${Date.now()}_2`, textRu: '', textTj: '' },
                { id: `opt_${Date.now()}_3`, textRu: '', textTj: '' },
                { id: `opt_${Date.now()}_4`, textRu: '', textTj: '' },
            ];
            newQuestion.correctId = null;
        } else if (type === 'matching') {
            newQuestion.leftItems = [
                { id: 'A', textRu: '', textTj: '' },
                { id: 'B', textRu: '', textTj: '' },
                { id: 'C', textRu: '', textTj: '' },
                { id: 'D', textRu: '', textTj: '' },
            ];
            newQuestion.rightItems = [
                { id: '1', textRu: '', textTj: '' },
                { id: '2', textRu: '', textTj: '' },
                { id: '3', textRu: '', textTj: '' },
                { id: '4', textRu: '', textTj: '' },
                { id: '5', textRu: '', textTj: '' },
            ];
            newQuestion.correctMatches = { A: '', B: '', C: '', D: '' };
        } else if (type === 'numeric') {
            newQuestion.digits = ['', '', '', ''];
            newQuestion.unit = '';
        }

        onChange({ ...data, questions: [...questions, newQuestion] });
    };

    const updateQuestion = (qIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex] = { ...updated[qIndex], [field]: value };
        onChange({ ...data, questions: updated });
    };

    const deleteQuestion = (qIndex) => {
        const updated = questions.filter((_, i) => i !== qIndex);
        onChange({ ...data, questions: updated });
    };

    // Обработчики для типа "Один из многих"
    const updateOption = (qIndex, optIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex].options[optIndex] = { ...updated[qIndex].options[optIndex], [field]: value };
        onChange({ ...data, questions: updated });
    };

    const setCorrectOption = (qIndex, optId) => {
        const updated = [...questions];
        updated[qIndex].correctId = optId;
        onChange({ ...data, questions: updated });
    };

    // Обработчики для типа "Соответствия"
    const updateLeftItem = (qIndex, itemIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex].leftItems[itemIndex] = { ...updated[qIndex].leftItems[itemIndex], [field]: value };
        onChange({ ...data, questions: updated });
    };

    const updateRightItem = (qIndex, itemIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex].rightItems[itemIndex] = { ...updated[qIndex].rightItems[itemIndex], [field]: value };
        onChange({ ...data, questions: updated });
    };

    const updateMatch = (qIndex, leftId, rightId) => {
        const updated = [...questions];
        updated[qIndex].correctMatches = { ...updated[qIndex].correctMatches, [leftId]: rightId };
        onChange({ ...data, questions: updated });
    };

    // Обработчики для типа "Числовой ответ"
    const updateDigit = (qIndex, digitIndex, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;
        const updated = [...questions];
        updated[qIndex].digits[digitIndex] = value;
        onChange({ ...data, questions: updated });
    };

    const updateUnit = (qIndex, unit) => {
        const updated = [...questions];
        updated[qIndex].unit = unit;
        onChange({ ...data, questions: updated });
    };

    // Функции авто-перевода
    const autoTranslateQuestion = async (qIndex) => {
        const key = `q_${qIndex}`;
        setTranslating(prev => ({ ...prev, [key]: true }));
        try {
            const translated = await translateText(questions[qIndex].textRu, 'ru', 'tj');
            updateQuestion(qIndex, 'textTj', translated);
        } finally {
            setTranslating(prev => ({ ...prev, [key]: false }));
        }
    };

    const autoTranslateOption = async (qIndex, optIndex) => {
        const key = `opt_${qIndex}_${optIndex}`;
        setTranslating(prev => ({ ...prev, [key]: true }));
        try {
            const opt = questions[qIndex].options[optIndex];
            const translated = await translateText(opt.textRu, 'ru', 'tj');
            updateOption(qIndex, optIndex, 'textTj', translated);
        } finally {
            setTranslating(prev => ({ ...prev, [key]: false }));
        }
    };

    const autoTranslateLeftItem = async (qIndex, itemIndex) => {
        const key = `left_${qIndex}_${itemIndex}`;
        setTranslating(prev => ({ ...prev, [key]: true }));
        try {
            const item = questions[qIndex].leftItems[itemIndex];
            const translated = await translateText(item.textRu, 'ru', 'tj');
            updateLeftItem(qIndex, itemIndex, 'textTj', translated);
        } finally {
            setTranslating(prev => ({ ...prev, [key]: false }));
        }
    };

    const autoTranslateRightItem = async (qIndex, itemIndex) => {
        const key = `right_${qIndex}_${itemIndex}`;
        setTranslating(prev => ({ ...prev, [key]: true }));
        try {
            const item = questions[qIndex].rightItems[itemIndex];
            const translated = await translateText(item.textRu, 'ru', 'tj');
            updateRightItem(qIndex, itemIndex, 'textTj', translated);
        } finally {
            setTranslating(prev => ({ ...prev, [key]: false }));
        }
    };

    const [showTypeMenu, setShowTypeMenu] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gaming-pink flex items-center gap-2">
                    <ClipboardList size={20} />
                    {lang === 'ru' ? 'Вопросы теста' : 'Саволҳои тест'}
                </h4>
                <div className="relative">
                    <button
                        onClick={() => setShowTypeMenu(!showTypeMenu)}
                        className="flex items-center gap-2 px-3 py-2 bg-gaming-pink/20 text-gaming-pink rounded-xl hover:bg-gaming-pink/30 transition-colors text-sm"
                    >
                        <Plus size={16} />
                        {lang === 'ru' ? 'Добавить вопрос' : 'Илова кардани савол'}
                        <ChevronDown size={14} />
                    </button>
                    {showTypeMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-gaming-card border border-white/10 rounded-xl shadow-xl z-10 min-w-[200px] overflow-hidden">
                            {QUESTION_TYPES.map(type => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => { addQuestion(type.id); setShowTypeMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <Icon size={18} className="text-gaming-pink" />
                                        <span className="text-sm">{type.label[lang]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {questions.length === 0 ? (
                <div className="text-center py-8 text-gaming-textMuted">
                    <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                    <p>{lang === 'ru' ? 'Нет вопросов. Добавьте первый!' : 'Саволе нест. Аввалинро илова кунед!'}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {questions.map((q, qIndex) => (
                        <div key={q.id} className="bg-gaming-bg/30 rounded-xl p-4 border border-white/5">
                            {/* Шапка вопроса */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gaming-textMuted">
                                        {lang === 'ru' ? 'Вопрос' : 'Савол'} #{qIndex + 1}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gaming-pink/20 text-gaming-pink rounded-full">
                                        {QUESTION_TYPES.find(t => t.id === q.type)?.label[lang] || q.type}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteQuestion(qIndex)}
                                    className="p-1 text-gaming-textMuted hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Текст вопроса RU */}
                            <div className="mb-3">
                                <input
                                    type="text"
                                    value={q.textRu}
                                    onChange={(e) => updateQuestion(qIndex, 'textRu', e.target.value)}
                                    placeholder={lang === 'ru' ? 'Текст вопроса (RU)' : 'Матни савол (RU)'}
                                    className="w-full bg-gaming-bg/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gaming-pink/50 transition-colors"
                                />
                            </div>

                            {/* Текст вопроса TJ */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={q.textTj}
                                    onChange={(e) => updateQuestion(qIndex, 'textTj', e.target.value)}
                                    placeholder={lang === 'ru' ? 'Матни савол (TJ)' : 'Матни савол (TJ)'}
                                    className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gaming-accent/50 transition-colors"
                                />
                                <button
                                    onClick={() => autoTranslateQuestion(qIndex)}
                                    disabled={translating[`q_${qIndex}`]}
                                    className="px-2 py-2 bg-gaming-accent/20 text-gaming-accent rounded-lg hover:bg-gaming-accent/30 transition-colors disabled:opacity-50"
                                    title="Авто-перевод"
                                >
                                    {translating[`q_${qIndex}`] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                </button>
                            </div>

                            {/* ТИП: Один из многих */}
                            {q.type === 'multiple_choice' && (
                                <div className="space-y-2 ml-4">
                                    <span className="text-xs text-gaming-textMuted">
                                        {lang === 'ru' ? 'Варианты ответов (нажмите ✓ для правильного)' : 'Ҷавобҳо (✓ барои дуруст)'}
                                    </span>
                                    {q.options.map((opt, optIndex) => (
                                        <div key={opt.id} className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCorrectOption(qIndex, opt.id)}
                                                className={`p-1.5 rounded-lg transition-colors ${q.correctId === opt.id
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-gaming-card/50 text-gaming-textMuted hover:text-white'
                                                    }`}
                                            >
                                                <Check size={14} />
                                            </button>
                                            <span className="text-gaming-textMuted text-sm w-6">{String.fromCharCode(65 + optIndex)})</span>
                                            <input
                                                type="text"
                                                value={opt.textRu}
                                                onChange={(e) => updateOption(qIndex, optIndex, 'textRu', e.target.value)}
                                                placeholder="RU"
                                                className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gaming-primary/50"
                                            />
                                            <input
                                                type="text"
                                                value={opt.textTj}
                                                onChange={(e) => updateOption(qIndex, optIndex, 'textTj', e.target.value)}
                                                placeholder="TJ"
                                                className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gaming-accent/50"
                                            />
                                            <button
                                                onClick={() => autoTranslateOption(qIndex, optIndex)}
                                                disabled={translating[`opt_${qIndex}_${optIndex}`]}
                                                className="p-1.5 bg-gaming-accent/20 text-gaming-accent rounded-lg hover:bg-gaming-accent/30 transition-colors disabled:opacity-50"
                                            >
                                                {translating[`opt_${qIndex}_${optIndex}`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ТИП: Соответствия */}
                            {q.type === 'matching' && (
                                <div className="space-y-4 ml-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Левая колонка (A, B, C, D) */}
                                        <div className="space-y-2">
                                            <span className="text-xs text-gaming-textMuted block mb-2">
                                                {lang === 'ru' ? 'Левая колонка (A, B, C, D)' : 'Сутуну чап'}
                                            </span>
                                            {q.leftItems.map((item, idx) => (
                                                <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gaming-pink font-bold w-6">{item.id})</span>
                                                        <input
                                                            type="text"
                                                            value={item.textRu}
                                                            onChange={(e) => updateLeftItem(qIndex, idx, 'textRu', e.target.value)}
                                                            placeholder="RU"
                                                            className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gaming-pink/50"
                                                        />
                                                        <button
                                                            onClick={() => autoTranslateLeftItem(qIndex, idx)}
                                                            disabled={translating[`left_${qIndex}_${idx}`]}
                                                            className="p-1.5 bg-gaming-accent/20 text-gaming-accent rounded-lg hover:bg-gaming-accent/30 transition-colors disabled:opacity-50"
                                                        >
                                                            {translating[`left_${qIndex}_${idx}`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                        </button>
                                                    </div>
                                                    <div className="pl-8">
                                                        <input
                                                            type="text"
                                                            value={item.textTj}
                                                            onChange={(e) => updateLeftItem(qIndex, idx, 'textTj', e.target.value)}
                                                            placeholder="TJ (перевод)"
                                                            className="w-full bg-gaming-bg/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-gaming-accent/50"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Правая колонка (1, 2, 3, 4, 5) */}
                                        <div className="space-y-2">
                                            <span className="text-xs text-gaming-textMuted block mb-2">
                                                {lang === 'ru' ? 'Правая колонка (1-5)' : 'Сутуну рост'}
                                            </span>
                                            {q.rightItems.map((item, idx) => (
                                                <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gaming-accent font-bold w-6">{item.id})</span>
                                                        <input
                                                            type="text"
                                                            value={item.textRu}
                                                            onChange={(e) => updateRightItem(qIndex, idx, 'textRu', e.target.value)}
                                                            placeholder="RU"
                                                            className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gaming-primary/50"
                                                        />
                                                        <button
                                                            onClick={() => autoTranslateRightItem(qIndex, idx)}
                                                            disabled={translating[`right_${qIndex}_${idx}`]}
                                                            className="p-1.5 bg-gaming-accent/20 text-gaming-accent rounded-lg hover:bg-gaming-accent/30 transition-colors disabled:opacity-50"
                                                        >
                                                            {translating[`right_${qIndex}_${idx}`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                        </button>
                                                    </div>
                                                    <div className="pl-8">
                                                        <input
                                                            type="text"
                                                            value={item.textTj}
                                                            onChange={(e) => updateRightItem(qIndex, idx, 'textTj', e.target.value)}
                                                            placeholder="TJ (перевод)"
                                                            className="w-full bg-gaming-bg/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-gaming-accent/50"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Правильные соответствия */}
                                    <div className="bg-gaming-card/30 rounded-xl p-4 border border-white/10">
                                        <span className="text-sm font-semibold text-white block mb-4">
                                            {lang === 'ru' ? 'Сетка правильных ответов:' : 'Ҷадвали ҷавобҳои дуруст:'}
                                        </span>

                                        <div className="overflow-x-auto">
                                            <table className="border-separate border-spacing-2 mx-auto">
                                                <thead>
                                                    <tr>
                                                        <th className="w-8"></th>
                                                        {q.rightItems.map(right => (
                                                            <th key={right.id} className="text-center font-bold text-gaming-accent text-sm pb-2">
                                                                {right.id}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {q.leftItems.map(left => (
                                                        <tr key={left.id}>
                                                            <td className="text-center font-bold text-gaming-pink text-sm pr-2">
                                                                {left.id}
                                                            </td>
                                                            {q.rightItems.map(right => {
                                                                const isCorrect = q.correctMatches[left.id] === right.id;
                                                                return (
                                                                    <td key={right.id} className="text-center p-0.5">
                                                                        <button
                                                                            onClick={() => updateMatch(qIndex, left.id, right.id)}
                                                                            className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center
                                                                                ${isCorrect
                                                                                    ? 'bg-gaming-primary border-gaming-primary shadow-[0_0_8px_rgba(var(--gaming-primary-rgb),0.4)]'
                                                                                    : 'bg-white/5 border-white/20 hover:border-white/40'}`}
                                                                        >
                                                                            {isCorrect && <div className="w-3 h-3 bg-white rounded-full" />}
                                                                        </button>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-[10px] text-gaming-textMuted mt-4 text-center">
                                            {lang === 'ru'
                                                ? '* Нажимайте на пересечения для установки верного соответствия'
                                                : '* Барои муайян кардани мувофиқати дуруст ба буришҳо пахш кунед'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ТИП: Числовой ответ */}
                            {q.type === 'numeric' && (
                                <div className="space-y-4 ml-4">
                                    <span className="text-xs text-gaming-textMuted">
                                        {lang === 'ru' ? 'Введите правильный ответ (до 4 цифр):' : 'Ҷавоби дуруст (то 4 рақам):'}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-2">
                                            {q.digits.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    type="text"
                                                    value={digit}
                                                    onChange={(e) => updateDigit(qIndex, idx, e.target.value)}
                                                    maxLength={1}
                                                    className="w-12 h-12 text-center text-2xl font-bold bg-gaming-bg/50 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:border-gaming-primary transition-colors"
                                                    placeholder="0"
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gaming-textMuted text-sm">
                                                {lang === 'ru' ? 'Величина:' : 'Воҳид:'}
                                            </span>
                                            <select
                                                value={q.unit || ''}
                                                onChange={(e) => updateUnit(qIndex, e.target.value)}
                                                className="bg-gaming-bg/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                                            >
                                                {UNITS.map(u => (
                                                    <option key={u} value={u}>{u || (lang === 'ru' ? '(без величины)' : '(бе воҳид)')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-gaming-card/30 rounded-lg p-3 text-sm">
                                        <span className="text-gaming-textMuted">
                                            {lang === 'ru' ? 'Ответ: ' : 'Ҷавоб: '}
                                        </span>
                                        <span className="text-gaming-primary font-bold">
                                            {q.digits.filter(d => d).join('') || '—'} {q.unit}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TestEditor;
