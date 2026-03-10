import React, { useState, useEffect } from 'react';
import { Award, Loader2, Plus, RefreshCw, Users, BookOpen } from 'lucide-react';
import apiService from '../../../../services/apiService';
import MassGradingModal from './MassGradingModal';
import StudentGradesModal from './StudentGradesModal';
import UserAvatar from '../../../common/UserAvatar';

const ClassGradesTab = ({ classId, classData, isStudent, studentId }) => {
    const [loading, setLoading] = useState(true);
    const [structure, setStructure] = useState(null);
    const [matrix, setMatrix] = useState([]);
    
    // Новые стейты для переключателя и модалок
    const [viewMode, setViewMode] = useState(isStudent ? 'students' : 'topics'); // 'topics' | 'students'
    const [isMassModalOpen, setIsMassModalOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        if (classId && classData) {
            if (classData.subject_id) {
                fetchData();
            } else {
                setLoading(false);
            }
        }
    }, [classId, classData]);

    const fetchData = async () => {
        if (!classData?.subject_id) return;
        setLoading(true);
        try {
            // Загружаем одновременно структуру курса (для колонок) и матрицу оценок
            const [structData, matrixData] = await Promise.all([
                apiService.syllabusService.getStructure(classData.subject_id),
                apiService.tripleGradingService.getTripleGradesMatrix(classId)
            ]);
            setStructure(structData);
            
            // Если студент, фильтруем только его данные
            if (isStudent) {
                setMatrix(matrixData.filter(m => m.student_id === studentId));
            } else {
                setMatrix(matrixData);
            }
        } catch (err) {
            console.error('Ошибка загрузки журнала оценок:', err);
        } finally {
            setLoading(false);
        }
    };

    // Собираем плоский список тем
    const allTopics = [];
    if (structure && structure.sections) {
        structure.sections.forEach(sec => {
            if (sec.topics) {
                sec.topics.forEach(topic => {
                    allTopics.push({
                        ...topic,
                        sectionId: sec.id,
                        sectionTitle: sec.title
                    });
                });
            }
        });
    }

    if (!classData?.subject_id) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl text-center">
                <Award className="mx-auto mb-4 opacity-50" size={48} />
                <h3 className="text-xl font-bold mb-2">Предмет не назначен</h3>
                <p>Для отображения журнала необходимо перейти в Настройки и назначить предмет для этого класса.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 text-gaming-primary">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    if (!structure || !structure.sections || structure.sections.length === 0) {
        return (
            <div className="bg-gaming-card/40 border border-white/5 rounded-2xl p-12 text-center text-gaming-textMuted flex flex-col items-center">
                <Award size={64} className="mb-4 text-gaming-primary/50" />
                <h3 className="text-xl text-white font-medium mb-2">Программа курса пуста</h3>
                <p className="max-w-md mx-auto">
                    Чтобы выставлять оценки, необходимо добавить главы и темы в разделе создания контента.
                </p>
            </div>
        );
    }

    const getTopicAverage = (topicId) => {
        let total = 0;
        let count = 0;
        matrix.forEach(stu => {
            const gradeInfo = stu.grades?.find(g => g.topic_id === topicId);
            if (gradeInfo) {
                let effectiveGrade = null;
                // Приоритет оценки учителя, если она является числом
                if (gradeInfo.teacher_grade !== undefined && gradeInfo.teacher_grade !== null && !isNaN(parseInt(gradeInfo.teacher_grade))) {
                    effectiveGrade = parseInt(gradeInfo.teacher_grade);
                } else if (gradeInfo.system_grade !== undefined && gradeInfo.system_grade !== null) {
                    effectiveGrade = gradeInfo.system_grade;
                }

                if (effectiveGrade !== null) {
                    total += effectiveGrade;
                    count++;
                }
            }
        });
        return count > 0 ? Math.round(total / count) : null;
    };

    const renderTopicsView = () => {
        return (
            <div className="space-y-4">
                {structure.sections.map(sec => (
                    <div key={sec.id} className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-white/5 font-heading font-bold text-white border-b border-white/10">
                            {sec.title}
                        </div>
                        <div className="divide-y divide-white/5">
                            {sec.topics?.map(topic => {
                                const avgSys = getTopicAverage(topic.id);
                                const avgColor = avgSys >= 8 ? 'text-green-400' : avgSys >= 5 ? 'text-yellow-400' : avgSys > 0 ? 'text-red-400' : 'text-gray-500';
                                
                                return (
                                    <div 
                                        key={topic.id} 
                                        onClick={() => {
                                            if (!isStudent) {
                                                setSelectedSectionId(sec.id);
                                                setSelectedTopicId(topic.id);
                                                setIsMassModalOpen(true);
                                            }
                                        }}
                                        className={`px-6 py-4 flex items-center justify-between ${!isStudent ? 'cursor-pointer hover:bg-white/5 transition-colors group' : ''}`}
                                    >
                                        <div className="text-white font-medium group-hover:text-gaming-purple transition-colors truncate pr-4">
                                            {topic.title}
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-sm text-gaming-textMuted hidden sm:block">Средний балл класса:</div>
                                            <div className={`font-bold font-heading w-8 text-center ${avgColor}`}>
                                                {avgSys !== null ? avgSys : '-'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!sec.topics || sec.topics.length === 0) && (
                                <div className="px-6 py-4 text-gaming-textMuted text-sm">Темы отсутствуют</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderStudentsView = () => {
        return (
            <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="p-4 bg-black/40 text-xs text-gaming-textMuted uppercase font-bold">Студент</th>
                            <th className="p-4 bg-black/40 text-xs text-gaming-textMuted uppercase font-bold text-center w-32 hidden sm:table-cell">Ответов</th>
                            <th className="p-4 bg-black/40 text-xs text-gaming-textMuted uppercase font-bold text-center w-32 hidden sm:table-cell">Ошибок</th>
                            <th className="p-4 bg-black/40 text-xs text-gaming-textMuted uppercase font-bold text-center w-32" title="Итоговая средняя оценка">Ср. Оценка</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {matrix.map(stu => {
                            let totalGrade = 0;
                            let validGradeCount = 0;
                            
                            // Агрегированные суммы из SQL (get_topic_grades_matrix) содержат total_questions, total_errors в json.
                            // Но мы можем суммировать из массива grades:
                            let globalQs = 0;
                            let globalEs = 0;

                            stu.grades?.forEach(g => {
                                let effectiveGrade = null;
                                if (g.teacher_grade !== undefined && g.teacher_grade !== null && !isNaN(parseInt(g.teacher_grade))) {
                                    effectiveGrade = parseInt(g.teacher_grade);
                                } else if (g.system_grade !== undefined && g.system_grade !== null) {
                                    effectiveGrade = g.system_grade;
                                }

                                if (effectiveGrade !== null) {
                                    totalGrade += effectiveGrade;
                                    validGradeCount++;
                                }
                                // Эти поля агрегации приходят из SQL функции jsonb_agg:
                                globalQs += parseInt(g.total_questions || 0);
                                globalEs += parseInt(g.total_errors || 0);
                            });
                            const avgSys = validGradeCount > 0 ? Math.round(totalGrade / validGradeCount) : null;
                            const avgColor = avgSys >= 8 ? 'text-green-400' : avgSys >= 5 ? 'text-yellow-400' : avgSys > 0 ? 'text-red-400' : 'text-gray-500';

                            return (
                                <tr 
                                    key={stu.student_id} 
                                    onClick={() => {
                                        setSelectedStudent(stu);
                                        setIsStudentModalOpen(true);
                                    }}
                                    className="cursor-pointer hover:bg-white/5 transition-colors group"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar avatarUrl={stu.avatar_url} name={stu.full_name} size="md" />
                                            <div>
                                                <div className="text-white font-medium group-hover:text-gaming-purple transition-colors">{stu.full_name || 'Без Имени'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center hidden sm:table-cell">
                                        <span className="text-gaming-textMuted">{globalQs}</span>
                                    </td>
                                    <td className="p-4 text-center hidden sm:table-cell">
                                        <span className="text-red-400/80">{globalEs}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <strong className={`font-heading text-xl ${avgColor}`}>
                                            {avgSys !== null ? avgSys : '-'}
                                        </strong>
                                    </td>
                                </tr>
                            );
                        })}
                        {matrix.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gaming-textMuted">Ученики не найдены</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            
            {/* Панель управления (переключатель) */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gaming-card border border-white/5 rounded-2xl p-4">
                <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('topics')}
                        className={`flex-1 sm:flex-none px-6 py-2.5 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'topics' ? 'bg-gaming-purple text-white shadow-lg shadow-gaming-purple/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <BookOpen size={18} /> По темам
                    </button>
                    {!isStudent && (
                        <button
                            onClick={() => setViewMode('students')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'students' ? 'bg-gaming-accent text-white shadow-lg shadow-gaming-accent/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Users size={18} /> По ученикам
                        </button>
                    )}
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                        title="Обновить"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {!isStudent && viewMode === 'topics' && (
                        <button
                            onClick={() => {
                                setSelectedSectionId('');
                                setSelectedTopicId('');
                                setIsMassModalOpen(true);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gaming-primary hover:bg-gaming-primary/80 text-white rounded-xl font-medium transition-all shrink-0"
                        >
                            <Plus size={18} /> Массовое оценивание
                        </button>
                    )}
                </div>
            </div>

            {/* Контент: список */}
            {viewMode === 'topics' ? renderTopicsView() : renderStudentsView()}

            {/* Модалки */}
            {isMassModalOpen && (
                <MassGradingModal 
                    isOpen={isMassModalOpen}
                    onClose={() => setIsMassModalOpen(false)}
                    classId={classId}
                    classData={classData}
                    onSaveSuccess={fetchData}
                    initialSectionId={selectedSectionId}
                    initialTopicId={selectedTopicId}
                    structure={structure}
                />
            )}

            {isStudentModalOpen && (
                <StudentGradesModal
                    isOpen={isStudentModalOpen}
                    onClose={() => setIsStudentModalOpen(false)}
                    student={selectedStudent}
                    allTopics={allTopics}
                />
            )}
        </div>
    );
};

export default ClassGradesTab;
