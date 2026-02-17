import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../../services/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_SUBJECTS_LIST, SUBJECT_NAMES } from '../../constants/data';
import {
    Loader2, Search, Shield, ShieldCheck, ShieldAlert, User, UserPlus,
    X, Eye, EyeOff, BookOpen, Settings
} from 'lucide-react';

const AdminPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { isSuperAdmin, profile } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState(null);

    // Состояния модального окна добавления пользователя
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingUser, setAddingUser] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');
    const [newUser, setNewUser] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
    });

    // Состояния модального окна прав на предметы
    const [showPermsModal, setShowPermsModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherPerms, setTeacherPerms] = useState([]);
    const [savingPerms, setSavingPerms] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Используем RPC-функцию (SECURITY DEFINER) — обходит RLS
            const { data, error } = await supabase.rpc('get_all_profiles');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        // Админ может назначать только teacher и student
        if (!isSuperAdmin && (newRole === 'admin' || newRole === 'super_admin')) {
            alert('У вас нет прав для назначения этой роли');
            return;
        }

        setUpdating(userId);
        try {
            // RPC-функция с проверкой прав внутри
            const { error } = await supabase.rpc('update_user_role', {
                target_user_id: userId,
                new_role: newRole,
            });

            if (error) throw error;

            // Обновляем локальное состояние
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (error) {
            console.error('Ошибка обновления роли:', error);
            alert('Не удалось обновить роль');
        } finally {
            setUpdating(null);
        }
    };

    // Создание нового пользователя
    const handleAddUser = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddSuccess('');

        if (!newUser.email || !newUser.password) {
            setAddError('Email и пароль обязательны');
            return;
        }
        if (newUser.password.length < 6) {
            setAddError('Пароль должен быть не менее 6 символов');
            return;
        }

        setAddingUser(true);
        try {
            // Используем supabaseAdmin (persistSession: false)
            // чтобы signUp НЕ перезаписал текущую сессию в localStorage
            const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: {
                    data: {
                        full_name: newUser.full_name,
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (signUpData.user) {
                // RPC-функция (SECURITY DEFINER) для upsert профиля
                const { error: profileError } = await supabase.rpc('admin_upsert_profile', {
                    target_id: signUpData.user.id,
                    target_full_name: newUser.full_name,
                    target_role: newUser.role,
                });

                if (profileError) {
                    console.warn('Ошибка обновления профиля:', profileError);
                }
            }

            setAddSuccess(`Пользователь ${newUser.email} успешно создан!`);
            setNewUser({ full_name: '', email: '', password: '', role: 'student' });

            // Перезагружаем список пользователей
            await fetchUsers();

            // Закрываем модалку через 1.5 сек
            setTimeout(() => {
                setShowAddModal(false);
                setAddSuccess('');
            }, 1500);

        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            if (error.message?.includes('already registered')) {
                setAddError('Пользователь с таким email уже зарегистрирован');
            } else {
                setAddError(error.message || 'Ошибка при создании пользователя');
            }
        } finally {
            setAddingUser(false);
        }
    };

    // Открыть модалку с правами учителя
    const openPermsModal = async (teacher) => {
        setSelectedTeacher(teacher);
        setShowPermsModal(true);
        setSavingPerms(false);

        // Загружаем текущие права этого учителя
        try {
            const { data } = await supabase
                .from('subject_permissions')
                .select('*')
                .eq('user_id', teacher.id);

            // Формируем массив прав для всех предметов
            const perms = ALL_SUBJECTS_LIST.map(subjectId => {
                const existing = data?.find(p => p.subject_id === subjectId);
                return {
                    subject_id: subjectId,
                    can_edit: existing?.can_edit || false,
                };
            });
            setTeacherPerms(perms);
        } catch (error) {
            console.error('Ошибка загрузки прав:', error);
            setTeacherPerms(ALL_SUBJECTS_LIST.map(s => ({ subject_id: s, can_edit: false })));
        }
    };

    // Переключить право на предмет
    const togglePerm = (subjectId) => {
        setTeacherPerms(prev => prev.map(p =>
            p.subject_id === subjectId ? { ...p, can_edit: !p.can_edit } : p
        ));
    };

    // Сохранить права учителя
    const savePerms = async () => {
        if (!selectedTeacher) return;
        setSavingPerms(true);

        try {
            // Удаляем все старые права этого учителя
            await supabase
                .from('subject_permissions')
                .delete()
                .eq('user_id', selectedTeacher.id);

            // Вставляем только те, где can_edit = true
            const permsToInsert = teacherPerms
                .filter(p => p.can_edit)
                .map(p => ({
                    user_id: selectedTeacher.id,
                    subject_id: p.subject_id,
                    can_edit: true,
                    granted_by: profile?.id,
                }));

            if (permsToInsert.length > 0) {
                const { error } = await supabase
                    .from('subject_permissions')
                    .insert(permsToInsert);

                if (error) throw error;
            }

            setShowPermsModal(false);
        } catch (error) {
            console.error('Ошибка сохранения прав:', error);
            alert('Не удалось сохранить права');
        } finally {
            setSavingPerms(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'super_admin': return <ShieldAlert className="text-red-500" size={20} />;
            case 'admin': return <ShieldCheck className="text-gaming-accent" size={20} />;
            case 'teacher': return <Shield className="text-gaming-primary" size={20} />;
            default: return <User className="text-gray-400" size={20} />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'super_admin': return 'border-red-500/50 bg-red-500/10 text-red-400';
            case 'admin': return 'border-gaming-accent/50 bg-gaming-accent/10 text-gaming-accent';
            case 'teacher': return 'border-gaming-primary/50 bg-gaming-primary/10 text-gaming-primary';
            default: return 'border-white/10 bg-white/5 text-gray-400';
        }
    };

    // Роли, доступные для назначения текущим пользователем
    const getAvailableRoles = () => {
        if (isSuperAdmin) {
            return [
                { value: 'student', label: 'Ученик' },
                { value: 'user', label: 'Пользователь' },
                { value: 'teacher', label: 'Учитель' },
                { value: 'admin', label: 'Админ' },
                { value: 'super_admin', label: 'Супер Админ' },
            ];
        }
        // Обычный админ — только teacher и student
        return [
            { value: 'student', label: 'Ученик' },
            { value: 'user', label: 'Пользователь' },
            { value: 'teacher', label: 'Учитель' },
        ];
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="animate-spin text-gaming-primary" size={40} />
            </div>
        );
    }

    const availableRoles = getAvailableRoles();

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 container mx-auto max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                    Управление пользователями
                </h1>
                <p className="text-gaming-textMuted">
                    {isSuperAdmin
                        ? 'Полный доступ: управление ролями, правами и пользователями'
                        : 'Управление учителями и учениками'}
                </p>
            </div>

            {/* Поиск + Кнопка добавления */}
            <div className="mb-6 flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Поиск пользователей..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gaming-card border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-gaming-primary transition-colors"
                    />
                </div>
                <button
                    onClick={() => { setShowAddModal(true); setAddError(''); setAddSuccess(''); }}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gaming-primary to-gaming-purple text-white rounded-xl font-medium hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gaming-primary/25 whitespace-nowrap"
                >
                    <UserPlus size={20} />
                    Добавить
                </button>
            </div>

            {/* Таблица пользователей */}
            <div className="bg-gaming-card border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-gaming-textMuted font-medium">Пользователь</th>
                                <th className="p-4 text-gaming-textMuted font-medium">Email</th>
                                <th className="p-4 text-gaming-textMuted font-medium">Роль</th>
                                <th className="p-4 text-gaming-textMuted font-medium">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gaming-primary/20 flex items-center justify-center border border-gaming-primary/30">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">
                                                    {user.full_name || 'Без имени'}
                                                </div>
                                                <div className="text-xs text-gaming-textMuted">
                                                    ID: {user.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300">
                                        {user.email || 'Нет email'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {updating === user.id ? (
                                                <Loader2 className="animate-spin text-gaming-primary" size={20} />
                                            ) : (
                                                <>
                                                    <select
                                                        value={user.role || 'user'}
                                                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                                        className="bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-gray-300 focus:outline-none focus:border-gaming-primary cursor-pointer hover:bg-black/60 transition-colors"
                                                    >
                                                        {availableRoles.map(r => (
                                                            <option key={r.value} value={r.value}>{r.label}</option>
                                                        ))}
                                                    </select>

                                                    {/* Кнопка «Права» для учителей */}
                                                    {user.role === 'teacher' && (
                                                        <button
                                                            onClick={() => openPermsModal(user)}
                                                            title="Права на предметы"
                                                            className="p-2 rounded-lg bg-gaming-primary/10 border border-gaming-primary/30 text-gaming-primary hover:bg-gaming-primary/20 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gaming-textMuted">
                        Пользователи не найдены
                    </div>
                )}
            </div>

            {/* ========== МОДАЛКА: Добавление пользователя ========== */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}
                    />
                    <div className="relative bg-gaming-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-gaming-primary/10 animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                                <UserPlus size={22} className="text-gaming-primary" />
                                Добавить пользователя
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {addError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {addError}
                            </div>
                        )}
                        {addSuccess && (
                            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                                {addSuccess}
                            </div>
                        )}

                        <form onSubmit={handleAddUser} className="space-y-4">
                            {/* ФИО */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5">ФИО</label>
                                <input
                                    type="text"
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                    placeholder="Иванов Иван Иванович"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                    placeholder="user@example.com"
                                />
                            </div>

                            {/* Пароль */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5">Пароль *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                        placeholder="Минимум 6 символов"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Роль */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5">Роль</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                >
                                    {availableRoles.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Кнопки */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingUser}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gaming-primary to-gaming-purple text-white font-medium hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {addingUser ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Создание...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Создать
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== МОДАЛКА: Права на предметы ========== */}
            {showPermsModal && selectedTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowPermsModal(false)}
                    />
                    <div className="relative bg-gaming-card border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-gaming-primary/10 animate-fade-in-up">
                        {/* Заголовок */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                                    <BookOpen size={22} className="text-gaming-primary" />
                                    Права на предметы
                                </h2>
                                <p className="text-sm text-gaming-textMuted mt-1">
                                    {selectedTeacher.full_name || selectedTeacher.email}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPermsModal(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Список предметов с чекбоксами */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {teacherPerms.map(perm => (
                                <label
                                    key={perm.subject_id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${perm.can_edit
                                        ? 'border-gaming-primary/50 bg-gaming-primary/10'
                                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={perm.can_edit}
                                        onChange={() => togglePerm(perm.subject_id)}
                                        className="w-5 h-5 rounded border-white/20 bg-black/30 text-gaming-primary focus:ring-gaming-primary focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className={`font-medium ${perm.can_edit ? 'text-white' : 'text-gray-400'}`}>
                                        {SUBJECT_NAMES[perm.subject_id]?.[lang] || perm.subject_id}
                                    </span>
                                    {perm.can_edit && (
                                        <span className="ml-auto text-xs text-gaming-primary bg-gaming-primary/10 px-2 py-0.5 rounded-full">
                                            Редактирование
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>

                        {/* Кнопки */}
                        <div className="flex gap-3 pt-4 mt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setShowPermsModal(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={savePerms}
                                disabled={savingPerms}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gaming-primary to-gaming-purple text-white font-medium hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {savingPerms ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Сохранение...
                                    </>
                                ) : (
                                    'Сохранить'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
