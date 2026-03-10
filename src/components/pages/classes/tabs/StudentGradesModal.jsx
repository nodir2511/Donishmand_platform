import React from 'react';
import { X, Award, User } from 'lucide-react';
import UserAvatar from '../../../common/UserAvatar';

const StudentGradesModal = ({ isOpen, onClose, student, allTopics }) => {
    if (!isOpen || !student) return null;

    // Считаем среднюю системную оценку ученика
    let totalSysGrades = 0;
    let validSysCount = 0;

    student.grades?.forEach(g => {
        if (g.system_grade !== undefined && g.system_grade !== null) {
            totalSysGrades += g.system_grade;
            validSysCount++;
        }
    });

    const averageGrade = validSysCount > 0 ? Math.round(totalSysGrades / validSysCount) : null;
    const avgGradeColor = averageGrade >= 8 ? 'text-green-400' : averageGrade >= 5 ? 'text-yellow-400' : averageGrade > 0 ? 'text-red-400' : 'text-gray-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151525] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
                
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-white/5 bg-black/20 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <UserAvatar avatarUrl={student.avatar_url} name={student.full_name} size="lg" className="!rounded-full shrink-0" />
                        <div>
                            <h2 className="text-2xl font-heading font-bold text-white mb-1">
                                {student.full_name || 'Без имени'}
                            </h2>
                            <div className="flex gap-4 text-sm text-gaming-textMuted font-medium">
                                <span className="flex items-center gap-1">
                                    <Award size={16} /> Средний балл (Система): 
                                    <span className={`ml-1 font-bold ${avgGradeColor}`}>
                                        {averageGrade !== null ? averageGrade : '-'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Таблица тем */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 bg-[#0B0B15] text-xs uppercase text-gaming-textMuted tracking-wider font-bold border-b border-white/5">
                                        Название темы
                                    </th>
                                    <th className="p-4 bg-[#0B0B15] w-24 text-center border-b border-l border-white/5" title="Системная оценка">
                                        <span className="text-xs font-bold text-gaming-primary uppercase">🤖 Сист.</span>
                                    </th>
                                    <th className="p-4 bg-[#0B0B15] w-24 text-center border-b border-l border-white/5" title="Оценка учителя">
                                        <span className="text-xs font-bold text-orange-400 uppercase">👨‍🏫 Учит.</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {allTopics.map((topic, idx) => {
                                    const gradeData = student.grades?.find(g => g.topic_id === topic.id);
                                    
                                    const sGrade = gradeData?.system_grade;
                                    const tGrade = gradeData?.teacher_grade;
                                    
                                    const sGradeClass = sGrade >= 8 ? 'text-green-400' : sGrade >= 5 ? 'text-yellow-400' : sGrade > 0 ? 'text-red-400' : 'text-gray-500';
                                    const tGradeClass = tGrade === 'Н' ? 'text-red-500' : 'text-orange-400';

                                    // Определяем нужно ли показывать заголовок главы
                                    const isNewSection = idx === 0 || allTopics[idx - 1].sectionTitle !== topic.sectionTitle;

                                    return (
                                        <React.Fragment key={topic.id}>
                                            {isNewSection && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-2 bg-[#1A1A2A] border-b border-white/5 text-xs text-gaming-textMuted font-bold uppercase tracking-wider">
                                                        {topic.sectionTitle}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 border-b border-white/5">
                                                    <div className="text-sm font-medium text-white truncate max-w-[300px]" title={topic.title}>
                                                        {topic.title}
                                                    </div>
                                                </td>
                                                <td className="p-4 border-b border-l border-white/5 text-center">
                                                    <span className={`font-bold font-heading ${sGradeClass}`}>
                                                        {sGrade !== undefined && sGrade !== null ? sGrade : '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4 border-b border-l border-white/5 text-center relative group/cell">
                                                    <div className={`font-bold font-heading w-8 mx-auto flex items-center justify-center text-sm ${tGradeClass}`}>
                                                        {tGrade || '-'}
                                                    </div>
                                                    {gradeData?.comment && (
                                                        <div className="absolute opacity-0 group-hover/cell:opacity-100 transition-opacity z-50 bg-[#1A1A2A] border border-white/10 text-white text-xs p-3 rounded-lg shadow-xl shadow-black bottom-full right-0 mb-2 w-max max-w-[250px] pointer-events-none">
                                                            <div className="text-gaming-textMuted mb-1 font-medium">Комментарий учителя:</div>
                                                            <div className="whitespace-pre-wrap">{gradeData.comment}</div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}

                                {allTopics.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gaming-textMuted">
                                            Темы не найдены
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StudentGradesModal;
