import React from 'react';
import { Lock } from 'lucide-react';

// Компонент числового вопроса (ввод цифр по одной)
const NumericQuestion = ({
    question,
    answer,
    isLocked,
    lang,
    onAnswer,
}) => {
    return (
        <div className="space-y-4">
            <p className="text-sm text-gaming-textMuted">
                {isLocked
                    ? <span className="flex items-center gap-2"><Lock size={14} /> {lang === 'ru' ? 'Ответ зафиксирован' : 'Ҷавоб қайд шуд'}</span>
                    : (lang === 'ru' ? 'Введите ответ:' : 'Ҷавобро ворид кунед:')}
            </p>
            <div className="flex items-center justify-center gap-2">
                {[0, 1, 2, 3].map(idx => (
                    <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        disabled={isLocked}
                        value={(answer || '')[idx] || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val && !/^\d$/.test(val)) return;
                            const current = answer || '';
                            const arr = current.split('');
                            arr[idx] = val;
                            onAnswer(question.id, arr.join(''));
                            // Автофокус на следующий ввод
                            if (val && idx < 3) {
                                const next = e.target.nextElementSibling;
                                if (next) next.focus();
                            }
                        }}
                        className={`w-14 h-14 text-center text-2xl font-bold rounded-lg text-white focus:outline-none ${isLocked
                            ? 'bg-gaming-bg/50 border-2 border-gaming-primary/30 opacity-70 cursor-not-allowed'
                            : 'bg-gaming-bg/50 border-2 border-white/20 focus:border-gaming-primary'
                            }`}
                    />
                ))}
                {question.unit && (
                    <span className="text-xl text-gaming-textMuted ml-2">{question.unit}</span>
                )}
            </div>
        </div>
    );
};

export default React.memo(NumericQuestion);
