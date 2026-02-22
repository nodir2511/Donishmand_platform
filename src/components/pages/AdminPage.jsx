import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../../services/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { classService } from '../../services/classService';
import { branchService } from '../../services/branchService';
import { ALL_SUBJECTS_LIST, SUBJECT_NAMES } from '../../constants/data';
import {
    Loader2, Search, Shield, ShieldCheck, ShieldAlert, User, UserPlus,
    X, Eye, EyeOff, BookOpen, Settings, ChevronLeft, ChevronRight, Trash2, MapPin, Building
} from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

const AdminPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || 'ru';
    const { isSuperAdmin, profile } = useAuth();

    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'branches'

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 10;
    const debouncedSearchTerm = useDebounce(searchTerm, 500); // Задержка поиска
    const [updating, setUpdating] = useState(null);

    // Состояния для филиалов
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [addingBranch, setAddingBranch] = useState(false);

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
        subject: '',
        grade: '',
        language: 'tj',
        class_id: '' // Для привязки к классу при создании
    });

    const [availableClasses, setAvailableClasses] = useState([]);

    // Состояния модального окна прав на предметы
    const [showPermsModal, setShowPermsModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherPerms, setTeacherPerms] = useState([]);
    const [savingPerms, setSavingPerms] = useState(false);

    // Состояния модального окна предметов ученика
    const [showStudentSubjectsModal, setShowStudentSubjectsModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentSubjects, setStudentSubjects] = useState([]);

    // Сброс страницы при поиске
    useEffect(() => {
        if (activeTab === 'users') {
            setPage(1);
        }
    }, [debouncedSearchTerm, activeTab]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'branches') {
            fetchBranches();
        }
    }, [page, debouncedSearchTerm, activeTab]);

    // Загружаем список всех классов для селекта
    useEffect(() => {
        const fetchAllClasses = async () => {
            try {
                const { data } = await supabase.from('classes').select('id, name');
                if (data) setAvailableClasses(data);
            } catch (err) {
                console.error('Ошибка загрузки списка классов:', err);
            }
        };
        fetchAllClasses();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Используем новую RPC-функцию с пагинацией
            const { data, error } = await supabase.rpc('get_users_paginated', {
                page_number: page,
                items_per_page: PAGE_SIZE,
                search_query: debouncedSearchTerm
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setUsers(data);
                // total_count приходит в каждой строке (одинаковое для всех)
                const count = data[0].total_count;
                setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
            } else {
                setUsers([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Ошибка загрузки филиалов:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    const handleAddBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName.trim()) return;

        setAddingBranch(true);
        try {
            const newBranch = await branchService.createBranch(newBranchName);
            setBranches(prev => [...prev, newBranch].sort((a, b) => a.name.localeCompare(b.name)));
            setNewBranchName('');
            alert('Филиал успешно добавлен');
        } catch (error) {
            console.error('Ошибка добавления филиала:', error);
            alert(error.message || 'Ошибка добавления филиала');
        } finally {
            setAddingBranch(false);
        }
    };

    const handleDeleteBranch = async (branchId, branchName) => {
        if (!window.confirm(`Вы уверены, что хотите удалить филиал "${branchName}"? Классы этого филиала останутся, но без привязки к филиалу.`)) {
            return;
        }

        setUpdating(branchId);
        try {
            await branchService.deleteBranch(branchId);
            setBranches(prev => prev.filter(b => b.id !== branchId));
        } catch (error) {
            console.error('Ошибка удаления филиала:', error);
            alert('Не удалось удалить филиал');
        } finally {
            setUpdating(null);
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

    const handleDeleteUser = async (user) => {
        if (!isSuperAdmin) {
            alert('Только супер-администратор может удалять пользователей');
            return;
        }
        if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${user.email}? Это действие необратимо и удалит все связанные данные (если настроено каскадное удаление).`)) {
            return;
        }

        setUpdating(user.id);
        try {
            const { error } = await supabase.rpc('admin_delete_user', {
                target_user_id: user.id
            });

            if (error) throw error;

            setUsers(users.filter(u => u.id !== user.id));
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            alert('Не удалось удалить пользователя. Возможно, функция admin_delete_user не установлена в Supabase.');
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
                        role: newUser.role,
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
                    target_subject: newUser.role === 'teacher' ? newUser.subject : null,
                    target_grade: newUser.role === 'student' ? (parseInt(newUser.grade) || null) : null,
                    target_language: newUser.role === 'student' ? newUser.language : 'tj'
                });

                if (profileError) {
                    console.warn('Ошибка обновления профиля:', profileError);
                }

                // Если это был ученик и был выбран класс — прикрепляем
                if (newUser.role === 'student' && newUser.class_id) {
                    try {
                        await classService.addStudentToClass(newUser.class_id, signUpData.user.id);
                    } catch (classErr) {
                        console.warn('Ошибка прикрепления ученика к классу:', classErr);
                    }
                }
            }

            setAddSuccess(`Пользователь ${newUser.email} успешно создан!`);
            setNewUser({
                full_name: '', email: '', password: '', role: 'student',
                subject: '', grade: '', language: 'tj', class_id: ''
            });

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

    // Открыть модалку предметов ученика
    const openStudentSubjectsModal = (student) => {
        setSelectedStudent(student);
        setStudentSubjects(student.selected_subjects || []);
        setShowStudentSubjectsModal(true);
    };

    // Переключить предмет ученика
    const toggleStudentSubject = (subjectId) => {
        setStudentSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    // Сохранить предметы ученика
    const handleSaveStudentSubjects = async () => {
        if (!selectedStudent) return;
        setSavingPerms(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ selected_subjects: studentSubjects })
                .eq('id', selectedStudent.id);

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === selectedStudent.id
                    ? { ...u, selected_subjects: studentSubjects }
                    : u
            ));

            setShowStudentSubjectsModal(false);
        } catch (error) {
            console.error('Ошибка сохранения предметов ученика:', error);
            alert('Не удалось сохранить предметы');
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

    // Фильтрация теперь на сервере, здесь просто отображаем users
    const filteredUsers = users; // Имя переменной оставил для совместимости с рендером

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
                    {activeTab === 'users' ? 'Управление пользователями' : 'Управление филиалами'}
                </h1>
                <p className="text-gaming-textMuted">
                    {activeTab === 'users' ?
                        (isSuperAdmin
                            ? 'Полный доступ: управление ролями, правами и пользователями'
                            : 'Управление учителями и учениками')
                        : 'Управление списком филиалов для привязки классов'}
                </p>
            </div>

            {/* Вкладки (Tabs) */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'users'
                        ? 'bg-gaming-primary text-white shadow-lg shadow-gaming-primary/25'
                        : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                        }`}
                >
                    <User size={18} /> Пользователи
                </button>
                <button
                    onClick={() => setActiveTab('branches')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'branches'
                        ? 'bg-gaming-accent text-white shadow-lg shadow-gaming-accent/25'
                        : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                        }`}
                >
                    <Building size={18} /> Филиалы
                </button>
            </div>

            {activeTab === 'users' ? (
                <div className="animate-fade-in">
                    {/* Поиск + Кнопка добавления пользователей */}
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
                            Добавить пользователя
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

                                                            {/* Кнопка «Предметы» для учеников */}
                                                            {user.role === 'student' && (
                                                                <button
                                                                    onClick={() => openStudentSubjectsModal(user)}
                                                                    title="Предметы ученика"
                                                                    className="p-2 rounded-lg bg-gaming-accent/10 border border-gaming-accent/30 text-gaming-accent hover:bg-gaming-accent/20 transition-all hover:scale-105 active:scale-95"
                                                                >
                                                                    <BookOpen size={16} />
                                                                </button>
                                                            )}

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

                                                            {/* Кнопка «Удалить» для Супер-Админа */}
                                                            {isSuperAdmin && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(user)}
                                                                    title="Удалить пользователя"
                                                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all hover:scale-105 active:scale-95"
                                                                >
                                                                    <Trash2 size={16} />
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

                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-gaming-textMuted">
                                Страница <span className="text-white font-bold">{page}</span> из {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in max-w-2xl">
                    {/* Форма добавления филиала */}
                    <div className="bg-gaming-card border border-white/10 rounded-2xl p-6 mb-8">
                        <h2 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin size={22} className="text-gaming-accent" />
                            Добавить новый филиал
                        </h2>
                        <form onSubmit={handleAddBranch} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Название филиала (например: Душанбе, Худжанд)"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gaming-accent transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={addingBranch || !newBranchName.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-gaming-accent to-pink-500 text-white rounded-xl font-medium hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gaming-accent/20 flex items-center gap-2"
                            >
                                {addingBranch ? <Loader2 size={18} className="animate-spin" /> : 'Добавить'}
                            </button>
                        </form>
                    </div>

                    {/* Список филиалов */}
                    <div className="bg-gaming-card border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                        {loadingBranches ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="animate-spin text-gaming-accent" size={32} />
                            </div>
                        ) : branches.length === 0 ? (
                            <div className="p-12 text-center text-gaming-textMuted">
                                Нет филиалов. Создайте первый филиал выше.
                            </div>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {branches.map(branch => (
                                    <li key={branch.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gaming-accent/10 flex items-center justify-center border border-gaming-accent/20">
                                                <Building className="text-gaming-accent" size={20} />
                                            </div>
                                            <span className="font-medium text-white text-lg">{branch.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteBranch(branch.id, branch.name)}
                                            disabled={updating === branch.id}
                                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all"
                                            title="Удалить филиал"
                                        >
                                            {updating === branch.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

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

                            {/* Дополнительные поля для Учителя */}
                            {newUser.role === 'teacher' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-sm text-gaming-textMuted mb-1.5">Предмет</label>
                                    <select
                                        value={newUser.subject}
                                        onChange={(e) => setNewUser({ ...newUser, subject: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                    >
                                        <option value="">Выберите предмет</option>
                                        {ALL_SUBJECTS_LIST.map(slug => (
                                            <option key={slug} value={slug}>
                                                {SUBJECT_NAMES[slug]?.[lang] || slug}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Дополнительные поля для Ученика */}
                            {newUser.role === 'student' && (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                                    <div>
                                        <label className="block text-sm text-gaming-textMuted mb-1.5">Класс</label>
                                        <select
                                            value={newUser.grade}
                                            onChange={(e) => setNewUser({ ...newUser, grade: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                        >
                                            <option value="">Выберите...</option>
                                            {[11, 10, 9, 8, 7, 6, 5].map(g => (
                                                <option key={g} value={g}>{g} класс</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gaming-textMuted mb-1.5">Язык</label>
                                        <select
                                            value={newUser.language}
                                            onChange={(e) => setNewUser({ ...newUser, language: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                        >
                                            <option value="tj">Тоҷикӣ</option>
                                            <option value="ru">Русский</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm text-gaming-textMuted mb-1.5">Прикрепить к классу (Опционально)</label>
                                        <select
                                            value={newUser.class_id}
                                            onChange={(e) => setNewUser({ ...newUser, class_id: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                        >
                                            <option value="">Не прикреплять</option>
                                            {availableClasses.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

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

            {/* Модальное окно прав ученика на предметы */}
            {showStudentSubjectsModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gaming-card border border-white/10 rounded-3xl p-8 max-w-md w-full relative animate-fade-in-up">
                        <button
                            onClick={() => setShowStudentSubjectsModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">Предметы ученика</h2>
                        <p className="text-gaming-textMuted mb-6"> {selectedStudent.full_name || selectedStudent.email}</p>

                        <div className="space-y-2 mb-8 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {ALL_SUBJECTS_LIST.map(subjectId => {
                                const isSelected = studentSubjects.includes(subjectId);
                                const title = SUBJECT_NAMES[subjectId]?.[lang] || subjectId;
                                return (
                                    <div
                                        key={subjectId}
                                        onClick={() => toggleStudentSubject(subjectId)}
                                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-colors ${isSelected
                                            ? 'bg-gaming-primary/20 border-gaming-primary/50 text-white'
                                            : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="font-medium">{title}</div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-gaming-primary flex items-center justify-center">
                                                <ShieldCheck size={14} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowStudentSubjectsModal(false)}
                                className="px-6 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSaveStudentSubjects}
                                disabled={savingPerms}
                                className="bg-gaming-primary hover:bg-gaming-primary-hover text-white px-6 py-2 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {savingPerms ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
