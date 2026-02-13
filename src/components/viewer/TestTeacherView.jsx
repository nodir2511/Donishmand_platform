import React, { useState } from 'react';
import { X, CheckCircle, Eye, EyeOff } from 'lucide-react';

const TestTeacherView = ({ questions, lang, onClose }) => {
    const [showAllAnswers, setShowAllAnswers] = useState(false);
    const [visibleAnswers, setVisibleAnswers] = useState({});

    if (!questions || questions.length === 0) return null;

    const toggleAnswer = (id) => {
        setVisibleAnswers(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleAll = () => {
        const newState = !showAllAnswers;
        setShowAllAnswers(newState);
        const newVisible = {};
        questions.forEach(q => newVisible[q.id] = newState);
        setVisibleAnswers(newVisible);
    };

    const getQuestionText = (q) => lang === 'tj' ? (q.textTj || q.textRu) : q.textRu;
    const getOptionText = (opt) => lang === 'tj' ? (opt.textTj || opt.textRu) : opt.textRu;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-gaming-card/95 rounded-3xl border border-white/10 my-8 shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {lang === 'ru' ? 'Режим учителя: Просмотр теста' : 'Реҷаи омӯзгор: Дидани тест'}
                        </h2>
                        <p className="text-gaming-textMuted text-sm">
                            {questions.length} {lang === 'ru' ? 'вопросов' : 'савол'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-black/20 border-b border-white/5 flex justify-between items-center shrink-0">
                    <button
                        onClick={toggleAll}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showAllAnswers ? 'bg-gaming-primary text-white' : 'bg-white/10 text-gaming-textMuted hover:text-white'}`}
                    >
                        {showAllAnswers ? <EyeOff size={18} /> : <Eye size={18} />}
                        {showAllAnswers
                            ? (lang === 'ru' ? 'Скрыть все ответы' : 'Пинҳон кардани ҷавобҳо')
                            : (lang === 'ru' ? 'Показать все ответы' : 'Нишон додани ҷавобҳо')}
                    </button>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {questions.map((q, idx) => {
                        const isAnswerVisible = visibleAnswers[q.id];

                        return (
                            <div key={q.id} className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 bg-gaming-pink/10 text-gaming-pink rounded-lg flex items-center justify-center font-bold text-sm border border-gaming-pink/20">
                                            {idx + 1}
                                        </span>
                                        <h3 className="text-lg font-medium text-white pt-1">
                                            {getQuestionText(q)}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => toggleAnswer(q.id)}
                                        className={`p-2 rounded-lg transition-colors ${isAnswerVisible ? 'text-gaming-primary bg-gaming-primary/10' : 'text-gaming-textMuted hover:bg-white/5'}`}
                                        title={lang === 'ru' ? 'Показать/Скрыть ответ' : 'Нишон додан/Пинҳон кардан'}
                                    >
                                        {isAnswerVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {/* Content */}
                                <div className={`transition-all duration-300 ${isAnswerVisible ? 'opacity-100' : 'opacity-50 blur-sm select-none pointer-events-none'}`}>

                                    {/* Multiple Choice */}
                                    {q.type === 'multiple_choice' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                                            {q.options.map((opt, oIdx) => (
                                                <div
                                                    key={opt.id}
                                                    className={`p-3 rounded-xl border flex items-center gap-3 ${opt.id === q.correctId
                                                            ? 'bg-green-500/10 border-green-500/30 text-green-400 font-bold'
                                                            : 'bg-black/20 border-white/5 text-gaming-textMuted'
                                                        }`}
                                                >
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${opt.id === q.correctId ? 'bg-green-500 text-white' : 'bg-white/10'
                                                        }`}>
                                                        {String.fromCharCode(65 + oIdx)}
                                                    </span>
                                                    <span>{getOptionText(opt)}</span>
                                                    {opt.id === q.correctId && <CheckCircle size={16} className="ml-auto" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Matching */}
                                    {q.type === 'matching' && (
                                        <div className="pl-11 space-y-4">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-xs text-gaming-textMuted uppercase mb-2">{lang === 'ru' ? 'Элементы' : 'Элементҳо'}</p>
                                                    {q.leftItems.map((item, i) => (
                                                        <div key={item.id} className="mb-2 text-sm flex gap-2">
                                                            <span className="text-gaming-pink font-bold">{String.fromCharCode(65 + i)})</span>
                                                            <span className="text-white/80">{getOptionText(item)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gaming-textMuted uppercase mb-2">{lang === 'ru' ? 'Определения' : 'Таърифҳо'}</p>
                                                    {q.rightItems.map((item, i) => (
                                                        <div key={item.id} className="mb-2 text-sm flex gap-2">
                                                            <span className="text-gaming-accent font-bold">{i + 1})</span>
                                                            <span className="text-white/80">{getOptionText(item)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                                                <p className="text-sm text-green-400 font-bold mb-2">{lang === 'ru' ? 'Правильные пары:' : 'Ҷуфтҳои дуруст:'}</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {Object.entries(q.correctMatches).map(([l, r]) => {
                                                        const lIdx = q.leftItems.findIndex(i => i.id === l);
                                                        const rIdx = q.rightItems.findIndex(i => i.id === r);
                                                        return (
                                                            <span key={l} className="px-2 py-1 bg-green-500/10 rounded border border-green-500/20 text-sm">
                                                                {String.fromCharCode(65 + lIdx)} — {rIdx + 1}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Numeric */}
                                    {q.type === 'numeric' && (
                                        <div className="pl-11">
                                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                                                <span className="text-sm text-green-400">{lang === 'ru' ? 'Ответ:' : 'Ҷавоб:'}</span>
                                                <span className="text-xl font-bold text-white tracking-widest">
                                                    {q.digits.join('')}
                                                </span>
                                                {q.unit && <span className="text-gaming-textMuted">{q.unit}</span>}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default TestTeacherView;
