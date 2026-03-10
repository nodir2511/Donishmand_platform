import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Brain, UserCheck, AlertCircle } from 'lucide-react';
import apiService from '../../../../services/apiService';
import UserAvatar from '../../../common/UserAvatar';

const MassGradingModal = ({ isOpen, onClose, classId, classData, onSaveSuccess, initialSectionId = '', initialTopicId = '', structure }) => {
    
    const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId);
    const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
    const [selectedMode, setSelectedMode] = useState('system'); // 'system' | 'teacher'
    
    const [students, setStudents] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingStudentId, setSavingStudentId] = useState(null);
    const [error, setError] = useState('');
    
    // Формы ответа
    const [teacherInputs, setTeacherInputs] = useState({});

    useEffect(() => {
        if (!isOpen) {
            // Reset state
            setSelectedSectionId('');
            setSelectedTopicId('');
            setSelectedMode('system');
            setStudents([]);
            setTeacherInputs({});
            setError('');
            return;
        } else {
            if (initialSectionId) setSelectedSectionId(initialSectionId);
            if (initialTopicId) setSelectedTopicId(initialTopicId);
        }
    }, [isOpen, initialSectionId, initialTopicId]);

    // Когда меняется выбранная тема
    useEffect(() => {
        if (selectedTopicId) {
            loadTopicData();
        } else {
            setStudents([]);
        }
    }, [selectedTopicId, selectedMode]);

    const loadTopicData = async () => {
        if (!selectedTopicId) return;
        setLoadingData(true);
        setError('');
        
        try {
            // Ищем уроки выбранной темы
            let lessonIds = [];
            let foundTopic = null;
            structure?.sections?.forEach(sec => {
                const t = sec.topics?.find(tp => tp.id === selectedTopicId);
                if (t) {
                    foundTopic = t;
                    lessonIds = t.lessons?.map(l => l.id) || [];
                }
            });

            // Запрашиваем расчет системы для всех учеников
            const calcData = await apiService.tripleGradingService.calculateSystemGrades(classId, selectedTopicId, lessonIds);
            
            // Также запросим уже сохраненную матрицу, чтобы подставить ранее выставленные оценки (если есть)
            const matrix = await apiService.tripleGradingService.getTripleGradesMatrix(classId);

            const merged = calcData.map(calc => {
                const matrixStu = matrix.find(m => m.student_id === calc.student_id);
                const savedTopic = matrixStu?.grades?.find(g => g.topic_id === selectedTopicId);
                return {
                    ...calc,
                    saved_system: savedTopic?.system_grade,
                    saved_teacher: savedTopic?.teacher_grade || '',
                    saved_comment: savedTopic?.comment || ''
                };
            });
            
            setStudents(merged);
            
            // Инициализируем форму
            const initialInputs = {};
            merged.forEach(stu => {
                initialInputs[stu.student_id] = {
                    grade: stu.saved_teacher || '',
                    comment: stu.saved_comment || ''
                };
            });
            setTeacherInputs(initialInputs);
            
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить данные учеников");
        } finally {
            setLoadingData(false);
        }
    };

    const handleSave = async () => {
        if (!selectedTopicId) return;
        setSaving(true);
        setError('');

        try {
            const payload = students.map(stu => {
                const gradeInfo = teacherInputs[stu.student_id] || {};
                
                // Если мы в режиме 'system', то обновляем системную оценку "на лету" из расчета. 
                // Оценку учителя берем из стейта (если она там уже была).
                // Если мы в режиме 'teacher', то аналогично берем значения, но оставляем систему как была сохранена или как рассчитана?
                // По плану: если нажали "Сохранить", то сохраняются те оценки, которые сейчас на экране.
                return {
                    student_id: stu.student_id,
                    system_grade: selectedMode === 'system' ? stu.system_grade : stu.saved_system, 
                    // Если режима система, то фиксируем текущий её расчёт, иначе оставляем как в БД.
                    teacher_grade: gradeInfo.grade || null,
                    comment: gradeInfo.comment || null
                };
            });

            await apiService.tripleGradingService.saveTopicGrades(classId, selectedTopicId, payload);
            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Ошибка при сохранении оценок. Возможно формат данных неверен.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSingleSystemGrade = async (student) => {
        if (!selectedTopicId || student.system_grade === null) return;
        setSavingStudentId(student.student_id);
        setError('');

        try {
            const gradeInfo = teacherInputs[student.student_id] || {};
            const payload = [{
                student_id: student.student_id,
                system_grade: student.system_grade,
                teacher_grade: gradeInfo.grade || null,
                comment: gradeInfo.comment || null
            }];

            await apiService.tripleGradingService.saveTopicGrades(classId, selectedTopicId, payload);
            
            setStudents(prev => prev.map(s => 
                s.student_id === student.student_id 
                    ? { ...s, saved_system: student.system_grade } 
                    : s
            ));
            
            onSaveSuccess();
        } catch (err) {
            console.error(err);
            setError(`Ошибка при сохранении оценки ученика ${student.full_name || ''}`);
        } finally {
            setSavingStudentId(null);
        }
    };

    if (!isOpen) return null;

    const activeSection = structure?.sections?.find(s => s.id === selectedSectionId);

    const gradeOptions = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', 'Н'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#151525] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden shadow-2xl shadow-gaming-purple/20">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-heading font-bold text-white flex items-center gap-3">
                        <Brain className="text-gaming-purple" size={24} />
                        Массовое выставление оценок
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-xl bg-black/20 hover:bg-black/40">
                        <X size={20} />
                    </button>
                </div>

                {/* Filters / Selectors */}
                <div className="p-6 border-b border-white/10 bg-black/20 flex flex-wrap gap-4">
                    {!structure ? (
                        <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={16}/> Загрузка программы курса...</div>
                    ) : (
                        <>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs text-gaming-textMuted mb-1 font-medium">Глава</label>
                                <select 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gaming-purple focus:ring-1 focus:ring-gaming-purple transition-all"
                                    value={selectedSectionId}
                                    onChange={(e) => {
                                        setSelectedSectionId(e.target.value);
                                        setSelectedTopicId('');
                                    }}
                                >
                                    <option value="">-- Выберите главу --</option>
                                    {structure?.sections?.map(sec => (
                                        <option key={sec.id} value={sec.id}>{sec.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs text-gaming-textMuted mb-1 font-medium">Тема</label>
                                <select 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gaming-purple focus:ring-1 focus:ring-gaming-purple transition-all disabled:opacity-50"
                                    value={selectedTopicId}
                                    onChange={(e) => setSelectedTopicId(e.target.value)}
                                    disabled={!selectedSectionId}
                                >
                                    <option value="">-- Выберите тему --</option>
                                    {activeSection?.topics?.map(topic => (
                                        <option key={topic.id} value={topic.id}>{topic.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full sm:w-auto">
                                <label className="block text-xs text-gaming-textMuted mb-1 font-medium">Режим оценивания</label>
                                <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden p-1">
                                    <button
                                        onClick={() => setSelectedMode('system')}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedMode === 'system' ? 'bg-gaming-purple text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        🤖 Система
                                    </button>
                                    <button
                                        onClick={() => setSelectedMode('teacher')}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedMode === 'teacher' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        👨‍🏫 Учитель
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Body: Students List */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}

                    {!selectedTopicId ? (
                        <div className="text-center text-gaming-textMuted py-12 flex flex-col items-center">
                            <Brain className="opacity-20 mb-4" size={48} />
                            <p>Выберите главу и тему для начала выставления оценок</p>
                        </div>
                    ) : loadingData ? (
                        <div className="flex justify-center items-center py-20 text-gaming-purple">
                            <Loader2 className="animate-spin" size={40} />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center text-gaming-textMuted py-12">
                            <UserCheck className="mx-auto opacity-20 mb-4" size={48} />
                            <p>В этом классе пока нет учеников</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {students.map(stu => (
                                <div key={stu.student_id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
                                    
                                    <div className="flex items-center gap-4 w-full sm:w-1/3">
                                        <UserAvatar avatarUrl={stu.avatar_url} name={stu.full_name} size="md" />
                                        <div className="truncate">
                                            <div className="font-medium text-white truncate">{stu.full_name || 'Без имени'}</div>
                                            <div className="text-xs text-gaming-textMuted truncate">ID: {stu.student_id.substring(0,8)}...</div>
                                        </div>
                                    </div>

                                    {selectedMode === 'system' ? (
                                        <div className="w-full sm:w-2/3 flex items-center justify-end gap-6 text-sm">
                                            <div className="text-right">
                                                <span className="text-gaming-textMuted block text-xs">Всего вопросов</span>
                                                <span className="text-gray-300 font-medium">{stu.total_questions}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gaming-textMuted block text-xs">Ошибки</span>
                                                <span className="text-red-400 font-medium">{stu.total_errors}</span>
                                            </div>
                                            <div className="text-right min-w-[100px] bg-black/30 p-2 rounded-xl border border-white/5 relative group">
                                                <span className="text-gaming-textMuted block text-[10px] uppercase">Расчет (🤖)</span>
                                                {stu.system_grade !== null ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={`text-xl font-bold font-heading ${stu.system_grade >= 8 ? 'text-green-400' : stu.system_grade >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {stu.system_grade}
                                                        </span>
                                                        {(stu.saved_system !== stu.system_grade || stu.saved_system === undefined) && (
                                                            <button 
                                                                onClick={() => handleSaveSingleSystemGrade(stu)}
                                                                disabled={savingStudentId === stu.student_id || saving}
                                                                title="Сохранить эту оценку отдельно"
                                                                className="bg-gaming-purple hover:bg-gaming-purple/80 text-white p-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait"
                                                            >
                                                                {savingStudentId === stu.student_id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">—</span>
                                                )}
                                            </div>
                                            {stu.saved_system !== undefined && stu.saved_system !== null && stu.saved_system !== stu.system_grade && (
                                                <div className="text-xs text-gaming-textMuted max-w-[100px] leading-tight text-right">
                                                    Сохранено: <span className="text-white">{stu.saved_system}</span>
                                                    <div className="text-[10px] text-orange-400 mt-1">Будет перезаписано!</div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full sm:w-2/3 flex items-center gap-4 justify-end">
                                            <input 
                                                type="text"
                                                placeholder="Комментарий (опционально)"
                                                className="w-full max-w-[250px] bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition-colors"
                                                value={teacherInputs[stu.student_id]?.comment || ''}
                                                onChange={(e) => setTeacherInputs(prev => ({
                                                    ...prev, 
                                                    [stu.student_id]: { ...prev[stu.student_id], comment: e.target.value }
                                                }))}
                                            />
                                            <div className="relative shrink-0">
                                                <select 
                                                    className="appearance-none w-[70px] bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-center font-bold text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                                                    value={teacherInputs[stu.student_id]?.grade || ''}
                                                    onChange={(e) => setTeacherInputs(prev => ({
                                                        ...prev, 
                                                        [stu.student_id]: { ...prev[stu.student_id], grade: e.target.value }
                                                    }))}
                                                >
                                                    <option value="" className="text-gray-500 bg-[#151525]">-</option>
                                                    {gradeOptions.map(opt => (
                                                        <option key={opt} value={opt} className="bg-[#151525] text-white py-1">{opt}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gaming-textMuted" style={{ fontSize: '8px' }}>▼</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        Отмена
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!selectedTopicId || students.length === 0 || saving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                            !selectedTopicId || students.length === 0
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : selectedMode === 'system'
                                    ? 'bg-gaming-purple text-white hover:bg-gaming-purple/80 hover:shadow-lg hover:shadow-gaming-purple/30'
                                    : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30'
                        }`}
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {selectedMode === 'system' ? 'Сохранить оценки системы' : 'Сохранить оценки'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MassGradingModal;
