import React from 'react';

// Компонент вопроса на установление соответствия (A→1, B→2...)
const MatchingQuestion = ({
    question,
    answer,
    isLocked,
    lang,
    onAnswer,
    getOptionText,
}) => {
    return (
        <div className="space-y-6">
            {/* Списки определений (Варианты) */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/10">
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gaming-pink uppercase tracking-wider mb-2">
                        {lang === 'ru' ? 'Группа 1' : 'Гурӯҳи 1'}
                    </p>
                    {question.leftItems.map((left, idx) => (
                        <div key={left.id} className="text-sm flex gap-2 items-baseline">
                            <span className="font-bold text-gaming-pink min-w-[20px]">{String.fromCharCode(65 + idx)})</span>
                            <div className="flex flex-col gap-1">
                                <span className="text-gaming-textMuted leading-tight" dangerouslySetInnerHTML={{ __html: getOptionText(left) }} />
                                {left.image && (
                                    <img src={left.image} alt="Item" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gaming-accent uppercase tracking-wider mb-2">
                        {lang === 'ru' ? 'Группа 2' : 'Гурӯҳи 2'}
                    </p>
                    {question.rightItems.map((right, idx) => (
                        <div key={right.id} className="text-sm flex gap-2 items-baseline">
                            <span className="font-bold text-gaming-accent min-w-[20px]">{idx + 1})</span>
                            <div className="flex flex-col gap-1">
                                <span className="text-gaming-textMuted leading-tight" dangerouslySetInnerHTML={{ __html: getOptionText(right) }} />
                                {right.image && (
                                    <img src={right.image} alt="Item" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-sm text-gaming-textMuted text-center">{lang === 'ru' ? 'Выберите соответствия в сетке:' : 'Мувофиқатро дар ҷадвал интихоб кунед:'}</p>

            {/* Сетка (Матрица) */}
            <div className="flex justify-center">
                <div className="overflow-x-auto max-w-full pb-2">
                    <table className="border-separate border-spacing-1">
                        <thead>
                            <tr>
                                <th className="w-8"></th>
                                {question.rightItems.map((right, idx) => (
                                    <th key={right.id} className="text-center font-bold text-gaming-accent text-sm p-1">
                                        {idx + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {question.leftItems.map((left, idx) => (
                                <tr key={left.id}>
                                    <td className="text-center font-bold text-gaming-pink text-sm p-1">
                                        {String.fromCharCode(65 + idx)}
                                    </td>
                                    {question.rightItems.map(right => {
                                        const isSelected = answer?.[left.id] === right.id;
                                        return (
                                            <td key={right.id} className="text-center p-0.5">
                                                <button
                                                    onClick={() => onAnswer(question.id, {
                                                        ...(answer || {}),
                                                        [left.id]: right.id
                                                    })}
                                                    disabled={isLocked}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                                                        ${isSelected
                                                            ? 'bg-gaming-primary border-gaming-primary'
                                                            : isLocked
                                                                ? 'bg-white/5 border-white/10 opacity-30 cursor-not-allowed'
                                                                : 'bg-white/5 border-white/20 hover:border-white/40'}`}
                                                >
                                                    {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default React.memo(MatchingQuestion);
