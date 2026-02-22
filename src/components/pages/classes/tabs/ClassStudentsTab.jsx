import React, { useState, useEffect } from 'react';
import { classService } from '../../../../services/classService';
import { Users, UserPlus, X, Search, Loader2, UserMinus } from 'lucide-react';
import useDebounce from '../../../../hooks/useDebounce';

const ClassStudentsTab = ({ classId }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Модалка добавления
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const debouncedSearch = useDebounce(searchQuery, 400);

    useEffect(() => {
        if (classId) fetchMembers();
    }, [classId]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const data = await classService.getClassMembers(classId);
            setStudents(data);
        } catch (err) {
            console.error('Ошибка загрузки учеников:', err);
        } finally {
            setLoading(false);
        }
    };

    // Поиск учеников для добавления
    useEffect(() => {
        const searchStudents = async () => {
            if (!showAddModal) return;
            setSearching(true);
            try {
                const results = await classService.searchAvailableStudents(classId, debouncedSearch);
                setSearchResults(results);
            } catch (err) {
                console.error('Ошибка поиска учеников:', err);
            } finally {
                setSearching(false);
            }
        };
        searchStudents();
    }, [debouncedSearch, showAddModal, classId]);

    const handleAddStudent = async (studentId) => {
        setAddingId(studentId);
        try {
            await classService.addStudentToClass(classId, studentId);
            // Удаляем из результатов поиска
            setSearchResults(prev => prev.filter(s => s.id !== studentId));
            // Перезапрашиваем список учеников (чтобы дата вступления и данные обновились)
            fetchMembers();
        } catch (err) {
            console.error('Ошибка добавления ученика', err);
            alert(err.message || 'Ошибка добавления ученика');
        } finally {
            setAddingId(null);
        }
    };

    const handleRemoveStudent = async (studentId, studentName) => {
        if (!window.confirm(`Удалить ${studentName} из класса? Оценки останутся в базе, но ученик перестанет отображаться здесь.`)) return;

        try {
            await classService.removeStudentFromClass(classId, studentId);
            setStudents(prev => prev.filter(s => s.id !== studentId));
        } catch (err) {
            console.error('Ошибка удаления ученика', err);
            alert('Не удалось удалить ученика');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gaming-textMuted text-sm">Загрузка списка учеников...</div>;
    }

    return (
        <div>
            {/* Панель инструментов */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                    <Users size={24} className="text-gaming-primary" />
                    Список учеников ({students.length})
                </h2>
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gaming-primary/10 text-gaming-primary border border-gaming-primary/30 rounded-xl hover:bg-gaming-primary hover:text-white transition-all"
                >
                    <UserPlus size={18} />
                    Добавить учеников
                </button>
            </div>

            {/* Таблица учеников (или пустое состояние) */}
            {students.length === 0 ? (
                <div className="bg-gaming-card/40 border border-white/5 rounded-2xl p-8 text-center text-gaming-textMuted">
                    В этом классе пока нет ни одного ученика.
                </div>
            ) : (
                <div className="bg-gaming-card/40 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-gaming-textMuted text-sm">
                            <tr>
                                <th className="px-6 py-4 font-medium">Ученик</th>
                                <th className="px-6 py-4 font-medium">Школа / Класс</th>
                                <th className="px-6 py-4 font-medium">Дата вступления</th>
                                <th className="px-6 py-4 font-medium text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gaming-primary/20 flex items-center justify-center text-gaming-primary font-bold">
                                                {student.full_name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{student.full_name || 'Без имени'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {student.school || '-'} <br />
                                        <span className="text-gaming-textMuted text-xs">{student.grade ? `${student.grade} класс` : ''}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gaming-textMuted">
                                        {new Date(student.joinedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            title="Удалить из класса"
                                            onClick={() => handleRemoveStudent(student.id, student.full_name || student.email)}
                                            className="p-2 text-gaming-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Модалка добавления учеников из базы */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#151525] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-scale-in">

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                                <Search className="text-gaming-primary" /> Поиск учеников
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Введите имя или email ученика..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gaming-textMuted mt-2 px-2">
                                Отображаются только ученики, которых еще нет в вашем классе.
                            </p>
                        </div>

                        {/* Results list */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                            {searching ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-gaming-primary" size={24} />
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-8 text-gaming-textMuted">
                                    {searchQuery ? 'Никто не найден по этому запросу' : 'Ученики не найдены'}
                                </div>
                            ) : (
                                searchResults.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gaming-purple/20 flex items-center justify-center text-gaming-purple font-bold">
                                                {student.full_name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{student.full_name || 'Без имени'}</div>
                                                <div className="text-sm text-gaming-textMuted">
                                                    {student.school || 'Нет школы'} {student.grade ? `(${student.grade} кл)` : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddStudent(student.id)}
                                            disabled={addingId === student.id}
                                            className="px-4 py-2 bg-gaming-primary/20 text-gaming-primary hover:bg-gaming-primary hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {addingId === student.id ? <Loader2 size={16} className="animate-spin" /> : 'Добавить'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassStudentsTab;
