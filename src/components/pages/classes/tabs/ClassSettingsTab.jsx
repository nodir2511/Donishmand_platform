import React, { useState, useEffect } from 'react';
import { classService, branchService } from '../../../../services/apiService';
import { useAuth } from '../../../../contexts/AuthContext';
import {
    Settings, Save, Loader2, Link as LinkIcon, Copy, RefreshCw,
    Users, UserPlus, Search, X, Shield, ShieldAlert, UserMinus, Building, BookOpen
} from 'lucide-react';
import useDebounce from '../../../../hooks/useDebounce';

const ClassSettingsTab = ({ classData, onUpdate }) => {
    const { user, profile } = useAuth();

    // Флаги прав
    const isOwner = classData.teacher_id === user.id;
    const isSuperAdmin = profile?.role === 'super_admin';
    const canManageTeachers = isOwner || isSuperAdmin;
    // Обычный со-преподаватель не может удалять или переименовывать глобальные настройки
    const canEditSettings = isOwner || isSuperAdmin || profile?.role === 'admin';

    // Состояния основных настроек
    const [name, setName] = useState(classData.name || '');
    const [description, setDescription] = useState(classData.description || '');
    const [branchId, setBranchId] = useState(classData.branch_id || '');
    const [subjectId, setSubjectId] = useState(classData.subject_id || '');
    const [inviteCode, setInviteCode] = useState(classData.invite_code || '');

    // Жестко заданный список предметов
    const availableSubjects = [
        { id: 'math', name: 'Математика', icon: '📐' },
        { id: 'physics', name: 'Физика', icon: '⚡' },
        { id: 'dt', name: 'Design and Technology', icon: '🛠️' },
        { id: 'biology', name: 'Биология', icon: '🧬' },
        { id: 'chemistry', name: 'Химия', icon: '🧪' },
        { id: 'history', name: 'История', icon: '📜' }
    ];

    const [branches, setBranches] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Состояния преподавателей
    const [teachers, setTeachers] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);

    // Модалка добавления преподавателя
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const debouncedSearch = useDebounce(searchQuery, 400);

    useEffect(() => {
        fetchData();
    }, [classData.id]);

    const fetchData = async () => {
        try {
            const [branchesData, teachersData] = await Promise.all([
                branchService.getBranches(),
                classService.getClassTeachers(classData.id)
            ]);
            setBranches(branchesData);
            setTeachers(teachersData);
        } catch (err) {
            console.error('Ошибка загрузки данных настроек:', err);
        } finally {
            setLoadingTeachers(false);
        }
    };

    // --- ОБНОВЛЕНИЕ НАСТРОЕК ---
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        setSaveMessage('');
        try {
            const updates = {
                name: name.trim(),
                description: description.trim() || null,
                branch_id: branchId || null,
                subject_id: subjectId || null
            };
            const updatedClass = await classService.updateClass(classData.id, updates);
            onUpdate(updatedClass);
            setSaveMessage('Настройки успешно сохранены');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            setSaveMessage('Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateCode = async () => {
        setIsSaving(true);
        try {
            // Генерация случайного кода 6-8 символов
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const updatedClass = await classService.updateClass(classData.id, { invite_code: newCode });
            setInviteCode(newCode);
            onUpdate(updatedClass);
        } catch (err) {
            console.error('Ошибка генерации кода:', err);
            alert('Не удалось сгенерировать код. Возможно, он уже существует.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyCode = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        alert('Код скопирован в буфер обмена');
    };

    // --- УПРАВЛЕНИЕ ПРЕПОДАВАТЕЛЯМИ ---
    useEffect(() => {
        const searchAvailableTeachers = async () => {
            if (!showAddModal) return;
            setSearching(true);
            try {
                const results = await classService.searchAvailableTeachers(classData.id, debouncedSearch);
                setSearchResults(results);
            } catch (err) {
                console.error('Ошибка поиска учителей:', err);
            } finally {
                setSearching(false);
            }
        };
        searchAvailableTeachers();
    }, [debouncedSearch, showAddModal, classData.id]);

    const handleAddTeacher = async (teacherId) => {
        setAddingId(teacherId);
        try {
            await classService.addTeacherToClass(classData.id, teacherId);
            setSearchResults(prev => prev.filter(t => t.id !== teacherId));
            const updatedTeachers = await classService.getClassTeachers(classData.id);
            setTeachers(updatedTeachers);
        } catch (err) {
            console.error('Ошибка добавления учителя', err);
            alert(err.message || 'Ошибка добавления учителя');
        } finally {
            setAddingId(null);
        }
    };

    const handleRemoveTeacher = async (teacherId, teacherName) => {
        if (!window.confirm(`Вы уверены, что хотите удалить ${teacherName} из преподавателей этого класса?`)) return;

        try {
            await classService.removeTeacherFromClass(classData.id, teacherId);
            setTeachers(prev => prev.filter(t => t.id !== teacherId));
            if (teacherId === user.id) {
                // Если преподаватель удалил сам себя
                window.location.href = '/classes';
            }
        } catch (err) {
            console.error('Ошибка удаления учителя', err);
            alert('Не удалось удалить учителя');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-white text-sm">

            {/* БЛОК 1: Основные настройки */}
            <div className="bg-gaming-card/40 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                    <Settings className="text-gaming-primary" size={24} />
                    Основные настройки
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-gaming-textMuted mb-2">Название класса</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!canEditSettings}
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors disabled:opacity-50"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gaming-textMuted mb-2">Описание класса (необязательно)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={!canEditSettings}
                            placeholder="Например: Расписание, ссылка на материалы, правила класса..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-gaming-primary transition-colors disabled:opacity-50 min-h-[100px] resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-gaming-textMuted mb-2">Предмет (необязательно)</label>
                        <div className="relative">
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                disabled={!canEditSettings}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-gaming-primary appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">Без привязки к предмету</option>
                                {availableSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.icon} {subject.name}</option>
                                ))}
                            </select>
                            <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gaming-textMuted mb-2">Филиал</label>
                        <div className="relative">
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                disabled={!canEditSettings}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-gaming-primary appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">Без привязки к филиалу</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                            <Building className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                        </div>
                    </div>

                    {/* Код приглашения */}
                    <div className="pt-4 border-t border-white/5">
                        <label className="block text-gaming-textMuted mb-2">Код приглашения</label>
                        <p className="text-xs text-gaming-textMuted mb-3">
                            Ученики и другие преподаватели могут использовать этот код на странице "Классы", чтобы автоматически присоединиться к этому классу.
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="flex gap-2 w-full sm:flex-1 max-w-sm">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        value={inviteCode || 'Нет кода'}
                                        readOnly
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 sm:pl-12 pr-2 sm:pr-4 text-gaming-primary font-bold tracking-wider focus:outline-none text-center sm:text-left"
                                    />
                                </div>

                                {inviteCode && (
                                    <button
                                        type="button"
                                        onClick={handleCopyCode}
                                        className="p-3 bg-white/5 text-gray-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0"
                                        title="Скопировать"
                                    >
                                        <Copy size={20} />
                                    </button>
                                )}
                            </div>

                            {canEditSettings && (
                                <button
                                    type="button"
                                    onClick={handleGenerateCode}
                                    disabled={isSaving}
                                    className="px-4 py-3 bg-gaming-primary/10 text-gaming-primary hover:bg-gaming-primary hover:text-white rounded-xl transition-colors font-medium flex justify-center items-center gap-2 w-full sm:w-auto shrink-0"
                                >
                                    <RefreshCw size={18} className={isSaving ? 'animate-spin' : ''} />
                                    {inviteCode ? 'Сгенерировать новый' : 'Создать код'}
                                </button>
                            )}
                        </div>
                    </div>

                    {canEditSettings && (
                        <div className="pt-6 flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-3 bg-gaming-primary text-white rounded-xl font-medium hover:bg-gaming-primary/80 transition-active flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Сохранить изменения
                            </button>
                            {saveMessage && (
                                <span className={saveMessage.includes('Ошибка') ? 'text-red-400' : 'text-green-400'}>
                                    {saveMessage}
                                </span>
                            )}
                        </div>
                    )}
                </form>
            </div>

            {/* БЛОК 2: Преподаватели класса */}
            <div className="bg-gaming-card/40 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-heading font-bold flex items-center gap-2">
                            <Users className="text-gaming-purple" size={24} />
                            Преподаватели класса
                        </h3>
                        <p className="text-xs text-gaming-textMuted mt-1">
                            Создатель имеет полный контроль. Со-преподаватели могут управлять учениками и оценками.
                        </p>
                    </div>

                    {canManageTeachers && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setShowAddModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gaming-purple/10 text-gaming-purple border border-gaming-purple/30 rounded-xl hover:bg-gaming-purple hover:text-white transition-active"
                        >
                            <UserPlus size={18} />
                            Добавить преподавателя
                        </button>
                    )}
                </div>

                {loadingTeachers ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-gaming-primary" size={30} />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Создатель класса */}
                        <div className="bg-white/5 border border-gaming-primary/30 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gaming-primary/20 flex items-center justify-center text-gaming-primary font-bold">
                                    {(Array.isArray(classData.teacher) ? classData.teacher[0]?.full_name : classData.teacher?.full_name)?.[0]?.toUpperCase() || 'T'}
                                </div>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {(Array.isArray(classData.teacher) ? classData.teacher[0]?.full_name : classData.teacher?.full_name) || 'Неизвестный'}
                                        <span className="px-2 py-0.5 bg-gaming-primary/20 text-gaming-primary text-xs rounded-full flex items-center gap-1 border border-gaming-primary/30">
                                            <Shield size={12} /> Создатель
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Со-преподаватели */}
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                                        {teacher.full_name?.[0]?.toUpperCase() || 'T'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{teacher.full_name || 'Неизвестный'}</div>
                                    </div>
                                </div>

                                {/* Удалить может либо создатель/админ, либо сам со-преподаватель выходя из класса */}
                                {(canManageTeachers || teacher.id === user.id) && (
                                    <button
                                        onClick={() => handleRemoveTeacher(teacher.id, teacher.full_name)}
                                        className="p-2 text-gaming-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title={teacher.id === user.id ? "Выйти из класса" : "Удалить преподавателя"}
                                    >
                                        <UserMinus size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* МОДАЛКА ПОИСКА ПРЕПОДАВАТЕЛЕЙ */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#151525] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-scale-in">

                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                                <Search className="text-gaming-purple" /> Поиск преподавателей
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Введите имя или email преподавателя..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-purple transition-colors"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                            {searching ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-gaming-purple" size={24} />
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-8 text-gaming-textMuted">
                                    {searchQuery ? 'Никто не найден по этому запросу' : 'Преподаватели не найдены'}
                                </div>
                            ) : (
                                searchResults.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gaming-purple/20 flex items-center justify-center text-gaming-purple font-bold">
                                                {t.full_name?.[0]?.toUpperCase() || 'T'}
                                            </div>
                                            <div>
                                                <div className="font-medium">{t.full_name || 'Без имени'}</div>
                                                <div className="text-xs text-gaming-textMuted">Роль: {t.role}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddTeacher(t.id)}
                                            disabled={addingId === t.id}
                                            className="px-4 py-2 bg-gaming-purple/20 text-gaming-purple hover:bg-gaming-purple hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {addingId === t.id ? <Loader2 size={16} className="animate-spin" /> : 'Добавить'}
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

export default ClassSettingsTab;
