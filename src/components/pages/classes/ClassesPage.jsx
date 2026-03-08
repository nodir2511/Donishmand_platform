import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { classService } from '../../../services/classService';
import { branchService } from '../../../services/branchService';
import { useTranslation } from 'react-i18next';
import {
    Users, Plus, Loader2, BookOpen, GraduationCap,
    Calendar, ArrowRight, AlertCircle, X, CheckCircle, MapPin, Link as LinkIcon
} from 'lucide-react';

const ClassesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Состояния для модалки создания класса (только учитель/админ)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassBranchId, setNewClassBranchId] = useState('');
    const [newClassSubjectId, setNewClassSubjectId] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Состояния для модалки присоединения
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    // Состояния филиалов
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('all');

    const isTeacherOrAdmin = ['teacher', 'admin', 'super_admin'].includes(profile?.role);
    const isStudent = profile?.role === 'student';

    // Жестко заданный список предметов (как в CreatorPage)
    const availableSubjects = [
        { id: 'math', name: 'Математика', icon: '📐' },
        { id: 'physics', name: 'Физика', icon: '⚡' },
        { id: 'dt', name: 'Design and Technology', icon: '🛠️' },
        { id: 'biology', name: 'Биология', icon: '🧬' },
        { id: 'chemistry', name: 'Химия', icon: '🧪' },
        { id: 'history', name: 'История', icon: '📜' }
    ];

    useEffect(() => {
        if (profile) {
            fetchClasses();
            fetchBranches();
        }
    }, [profile]);

    const fetchBranches = async () => {
        try {
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (err) {
            console.error('Ошибка загрузки филиалов:', err);
        }
    };

    const fetchClasses = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isTeacherOrAdmin) {
                // Учитель видит созданные им классы
                const data = await classService.getTeacherClasses(user.id);
                setClasses(data);
            } else if (isStudent) {
                // Ученик видит классы, в которых состоит
                const data = await classService.getStudentClasses(user.id);
                setClasses(data);
            }
        } catch (err) {
            console.error('Ошибка загрузки классов:', err);
            setError('Не удалось загрузить список классов');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        setCreateError('');

        if (!newClassName.trim()) {
            setCreateError('Введите название класса');
            return;
        }

        setIsCreating(true);
        try {
            const newClass = await classService.createClass(
                newClassName,
                user.id,
                newClassBranchId ? newClassBranchId : null,
                newClassSubjectId ? newClassSubjectId : null
            );
            // Добавляем новый класс в список с нулевым кол-вом учеников
            setClasses([{ ...newClass, studentsCount: 0 }, ...classes]);
            setShowCreateModal(false);
            setNewClassName('');
            setNewClassBranchId('');
            setNewClassSubjectId('');
        } catch (err) {
            console.error('Ошибка создания класса:', err);
            setCreateError('Не удалось создать класс. Попробуйте еще раз.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinClass = async (e) => {
        e.preventDefault();
        setJoinError('');

        if (!joinCode.trim()) {
            setJoinError('Введите код приглашения');
            return;
        }

        setIsJoining(true);
        try {
            await classService.joinClassByCode(user.id, joinCode, profile.role);
            // Если успешно - обновляем список классов
            await fetchClasses();
            setShowJoinModal(false);
            setJoinCode('');
        } catch (err) {
            console.error('Ошибка присоединения:', err);
            setJoinError(err.message || 'Не удалось присоединиться к классу');
        } finally {
            setIsJoining(false);
        }
    };

    const handleClassClick = (classId) => {
        navigate(`/classes/${classId}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Фильтрация классов по филиалу
    const filteredClasses = classes.filter(cls => {
        if (selectedBranchId === 'all') return true;
        if (selectedBranchId === 'none') return !cls.branch_id;
        return cls.branch_id === selectedBranchId;
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Шапка страницы */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white mb-2 flex items-center gap-3">
                        <Users className="text-gaming-primary" size={32} />
                        {isStudent ? 'Мои классы' : 'Управление классами'}
                    </h1>
                    <p className="text-gaming-textMuted">
                        {isStudent
                            ? 'Классы, в которых вы состоите'
                            : 'Создавайте классы и управляйте учениками'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => {
                            setShowJoinModal(true);
                            setJoinCode('');
                            setJoinError('');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium transition-all shadow-lg hover:bg-white/20 active:scale-95"
                    >
                        <LinkIcon size={20} />
                        Присоединиться по коду
                    </button>

                    {isTeacherOrAdmin && (
                        <button
                            onClick={() => {
                                setShowCreateModal(true);
                                setNewClassName('');
                                setNewClassBranchId('');
                                setNewClassSubjectId('');
                                setCreateError('');
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gaming-primary to-gaming-purple text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-gaming-primary/25 hover:scale-105 active:scale-95"
                        >
                            <Plus size={20} />
                            Создать класс
                        </button>
                    )}
                </div>
            </div>

            {/* Фильтр по филиалам */}
            {classes.length > 0 && branches.length > 0 && (
                <div className="mb-6 flex justify-end">
                    <div className="relative">
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="bg-gaming-card border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white focus:outline-none focus:border-gaming-primary appearance-none cursor-pointer"
                        >
                            <option value="all">Все филиалы</option>
                            <option value="none">Без филиала</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            )}

            {/* Контент */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-gaming-primary" size={40} />
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl flex items-center gap-4">
                    <AlertCircle size={24} />
                    <p>{error}</p>
                </div>
            ) : classes.length === 0 ? (
                <div className="bg-gaming-card/40 border border-white/5 rounded-2xl p-12 text-center text-gaming-textMuted flex flex-col items-center">
                    <GraduationCap size={64} className="mb-4 text-gaming-primary/50" />
                    <h3 className="text-xl text-white font-medium mb-2">
                        {isStudent ? 'Вы пока не состоите ни в одном классе' : 'У вас пока нет созданных классов'}
                    </h3>
                    <p className="max-w-md mx-auto relative z-10">
                        {isStudent
                            ? 'Спросите у вашего учителя, добавил ли он вас в свой класс.'
                            : 'Создайте свой первый класс, чтобы начать добавлять учеников и отслеживать их прогресс.'}
                    </p>
                    {isTeacherOrAdmin ? (
                        <button
                            onClick={() => {
                                setShowCreateModal(true);
                                setNewClassName('');
                                setNewClassBranchId('');
                                setNewClassSubjectId('');
                                setCreateError('');
                            }}
                            className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur-md relative z-10"
                        >
                            Создать первый класс
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setShowJoinModal(true);
                                setJoinCode('');
                                setJoinError('');
                            }}
                            className="mt-6 px-6 py-2.5 bg-gaming-primary/20 text-gaming-primary hover:bg-gaming-primary hover:text-white rounded-xl transition-colors backdrop-blur-md relative z-10 font-medium"
                        >
                            Присоединиться по коду
                        </button>
                    )}
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="bg-gaming-card/40 border border-white/5 rounded-2xl p-12 text-center text-gaming-textMuted">
                    <p>Нет классов, соответствующих выбранному филиалу.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((cls, idx) => (
                        <div
                            key={cls.id}
                            onClick={() => handleClassClick(cls.id)}
                            className="bg-gaming-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer group hover:border-gaming-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,93,211,0.15)] hover:-translate-y-1 animate-fade-in-up"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gaming-primary/10 rounded-xl text-gaming-primary group-hover:scale-110 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                                <ArrowRight className="text-gaming-textMuted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                            </div>

                            <h3 className="text-xl font-heading font-bold text-white mb-2 line-clamp-2">
                                {cls.name}
                            </h3>

                            <div className="space-y-2 mt-4 text-sm text-gaming-textMuted">
                                {isTeacherOrAdmin ? (
                                    <div className="flex items-center gap-2">
                                        <Users size={16} />
                                        <span>Учеников: <strong className="text-white">{cls.studentsCount || 0}</strong></span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Users size={16} />
                                        <span>Учитель: <strong className="text-white">{(Array.isArray(cls.teacher) ? cls.teacher[0]?.full_name : cls.teacher?.full_name) || 'Неизвестен'}</strong></span>
                                    </div>
                                )}
                                {cls.branch && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} />
                                        <span>Филиал: <strong className="text-white">{cls.branch.name}</strong></span>
                                    </div>
                                )}
                                {cls.subject_id && (
                                    <div className="flex items-center gap-2 text-gaming-textMuted">
                                        <span>Предмет: <strong className="text-gaming-accent">{availableSubjects.find(s => s.id === cls.subject_id)?.name || cls.subject_id}</strong></span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>Создан: {formatDate(cls.created_at || cls.joinedAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно создания класса */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-gaming-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-heading font-bold text-white">Создать новый класс</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateClass} className="p-6">
                            {createError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {createError}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm text-gaming-textMuted mb-2">Название класса</label>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    placeholder="Например: 10-А Информатика"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                    autoFocus
                                    required
                                />
                                <p className="mt-2 text-xs text-gaming-textMuted">
                                    Используйте понятные названия, чтобы ученикам было легче ориентироваться.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-gaming-textMuted mb-2">Предмет (необязательно, но рекомендуется)</label>
                                <div className="relative">
                                    <select
                                        value={newClassSubjectId}
                                        onChange={(e) => setNewClassSubjectId(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-gaming-primary appearance-none cursor-pointer"
                                    >
                                        <option value="">Без привязки к предмету</option>
                                        {availableSubjects.map(subject => (
                                            <option key={subject.id} value={subject.id}>{subject.icon} {subject.name}</option>
                                        ))}
                                    </select>
                                    <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-gaming-textMuted mb-2">Филиал (необязательно)</label>
                                <div className="relative">
                                    <select
                                        value={newClassBranchId}
                                        onChange={(e) => setNewClassBranchId(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-gaming-primary appearance-none cursor-pointer"
                                    >
                                        <option value="">Без привязки к филиалу</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newClassName.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gaming-primary text-white font-medium hover:bg-gaming-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Модальное окно присоединения по коду */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-gaming-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                                <LinkIcon className="text-gaming-primary" />
                                Присоединиться к классу
                            </h2>
                            <button
                                onClick={() => setShowJoinModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleJoinClass} className="p-6">
                            {joinError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {joinError}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm text-gaming-textMuted mb-2">Код приглашения</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="Введите 6-значный код..."
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-center text-xl font-bold tracking-widest text-gaming-primary placeholder-gray-600 focus:outline-none focus:border-gaming-primary transition-colors"
                                    autoFocus
                                    required
                                />
                                <p className="mt-4 text-xs text-gaming-textMuted text-center">
                                    Код приглашения можно получить у создателя класса.
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowJoinModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isJoining || !joinCode.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gaming-primary text-white font-medium hover:bg-gaming-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isJoining ? <Loader2 size={18} className="animate-spin" /> : 'Присоединиться'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassesPage;
