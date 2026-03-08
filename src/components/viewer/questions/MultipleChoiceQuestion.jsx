import React from 'react';
import { Lock } from 'lucide-react';

// Компонент вопроса с множественным выбором (A, B, C, D)
const MultipleChoiceQuestion = ({
    question,
    answer,
    isLocked,
    lang,
    onAnswer,
    getOptionText,
}) => {
    return (
        <div className="space-y-3">
            {isLocked && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm text-gaming-textMuted">
                    <Lock size={14} />
                    <span>{lang === 'ru' ? 'Ответ зафиксирован' : 'Ҷавоб қайд шуд'}</span>
                </div>
            )}
            {question.options.map((opt, idx) => {
                const isSelected = answer === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => onAnswer(question.id, opt.id)}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isSelected
                            ? 'bg-gaming-primary/20 border-gaming-primary'
                            : isLocked
                                ? 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                    >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isSelected ? 'bg-gaming-primary text-white' : 'bg-white/10'}`}>
                            {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex flex-col gap-2 w-full">
                            <span dangerouslySetInnerHTML={{ __html: getOptionText(opt) }} />
                            {opt.image && (
                                <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20 max-w-[200px]">
                                    <img src={opt.image} alt="Option" className="w-full h-auto object-cover" />
                                </div>
                            )}
                        </div>
                        {isSelected && isLocked && <Lock size={16} className="text-gaming-textMuted shrink-0" />}
                    </button>
                );
            })}
        </div>
    );
};

export default React.memo(MultipleChoiceQuestion);
