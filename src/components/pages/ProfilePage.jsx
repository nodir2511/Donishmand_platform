import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { CLUSTERS_STRUCTURE } from '../../constants/data';
import {
    User, Mail, Phone, Calendar, School, BookOpen,
    Shield, ShieldCheck, ShieldAlert, Save, Loader2,
    CheckCircle, AlertCircle, GraduationCap, Languages
} from 'lucide-react';

const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();

    // Состояние формы
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        birth_date: '',
        school: '',
        grade: '',
        branch: '',
        group_name: '',
        language: 'tj',
        subject: '',
        cluster_id: ''
    });

    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

    // Заполняем форму данными из профиля
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                birth_date: profile.birth_date || '',
                school: profile.school || '',
                grade: profile.grade || '',
                branch: profile.branch || '',
                group_name: profile.group_name || '',
                language: profile.language || 'tj',
                subject: profile.subject || '',
                cluster_id: profile.cluster_id || ''
            });
        }
    }, [profile]);

    // Обработчик изменения полей
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaveStatus(null);
    };

    // Сохранение профиля
    const handleSave = async () => {
        setSaving(true);
        setSaveStatus(null);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone || null,
                    birth_date: formData.birth_date || null,
                    school: formData.school || null,
                    grade: formData.grade ? parseInt(formData.grade) : null,
                    branch: formData.branch || null,
                    group_name: formData.group_name || null,
                    language: formData.language,
                    subject: formData.subject || null,
                    cluster_id: formData.cluster_id ? parseInt(formData.cluster_id) : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            setSaveStatus('success');

            // Автоскрытие уведомления
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    // Иконка и цвет для роли
    const getRoleDisplay = (role) => {
        switch (role) {
            case 'super_admin':
                return {
                    icon: <ShieldAlert className="text-red-500" size={20} />,
                    color: 'border-red-500/50 bg-red-500/10 text-red-400',
                    label: t('profilePage.roleSuperAdmin')
                };
            case 'admin':
                return {
                    icon: <ShieldCheck className="text-gaming-accent" size={20} />,
                    color: 'border-gaming-accent/50 bg-gaming-accent/10 text-gaming-accent',
                    label: t('profilePage.roleAdmin')
                };
            case 'teacher':
                return {
                    icon: <Shield className="text-gaming-primary" size={20} />,
                    color: 'border-gaming-primary/50 bg-gaming-primary/10 text-gaming-primary',
                    label: t('profilePage.roleTeacher')
                };
            default:
                return {
                    icon: <User className="text-gray-400" size={20} />,
                    color: 'border-white/10 bg-white/5 text-gray-400',
                    label: t('profilePage.roleStudent')
                };
        }
    };

    const roleDisplay = getRoleDisplay(profile?.role);

    // Инициалы для аватара
    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email?.[0].toUpperCase() || 'U';

    return (
        <div className="min-h-screen pb-12 px-4 container mx-auto max-w-4xl">
            {/* Шапка профиля */}
            <div className="mb-8 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Аватар */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gaming-primary via-gaming-purple to-gaming-pink flex items-center justify-center text-white font-heading font-bold text-3xl shadow-xl shadow-gaming-primary/20 border-2 border-white/10">
                            {userInitials}
                        </div>
                        <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg border ${roleDisplay.color}`}>
                            {roleDisplay.icon}
                        </div>
                    </div>

                    {/* Имя и роль */}
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-heading font-bold text-white">
                            {profile?.full_name || user?.email}
                        </h1>
                        <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleDisplay.color}`}>
                                {roleDisplay.label}
                            </span>
                            <span className="text-gaming-textMuted text-sm">
                                {user?.email}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Уведомление о сохранении */}
            {saveStatus && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in-up ${saveStatus === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {saveStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-medium">
                        {saveStatus === 'success' ? t('profilePage.saved') : t('profilePage.error')}
                    </span>
                </div>
            )}

            <div className={`grid gap-6 ${profile?.role !== 'super_admin' && profile?.role !== 'admin' ? 'lg:grid-cols-2' : ''}`}>
                {/* Личная информация */}
                <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-lg font-heading font-bold text-white mb-6 flex items-center gap-2">
                        <User size={20} className="text-gaming-primary" />
                        {t('profilePage.personalInfo')}
                    </h2>

                    <div className="space-y-4">
                        {/* ФИО */}
                        <div>
                            <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                <User size={14} />
                                {t('profilePage.fullName')}
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                placeholder={t('profilePage.fullName')}
                            />
                        </div>

                        {/* Email (только чтение) */}
                        <div>
                            <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                <Mail size={14} />
                                {t('profilePage.email')}
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full bg-black/30 border border-white/5 rounded-xl py-2.5 px-4 text-gray-400 cursor-not-allowed opacity-60"
                            />
                        </div>

                        {/* Телефон */}
                        <div>
                            <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                <Phone size={14} />
                                {t('profilePage.phone')}
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                placeholder="+992 XXX XX XX XX"
                            />
                        </div>

                        {/* Дата рождения */}
                        <div>
                            <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                <Calendar size={14} />
                                {t('profilePage.birthDate')}
                            </label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors [color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>

                {/* Информация об обучении (не показываем для super_admin и admin) */}
                {profile?.role !== 'super_admin' && profile?.role !== 'admin' && (
                    <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-lg font-heading font-bold text-white mb-6 flex items-center gap-2">
                            <GraduationCap size={20} className="text-gaming-accent" />
                            {t('profilePage.educationInfo')}
                        </h2>

                        <div className="space-y-4">
                            {/* Школа */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                    <School size={14} />
                                    {t('profilePage.school')}
                                </label>
                                <input
                                    type="text"
                                    name="school"
                                    value={formData.school}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                    placeholder={t('profilePage.school')}
                                />
                            </div>

                            {/* Класс */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                    <BookOpen size={14} />
                                    {t('profilePage.grade')}
                                </label>
                                <select
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                >
                                    <option value="">{t('profilePage.notSpecified')}</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Филиал */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5">
                                    {t('profilePage.branch')}
                                </label>
                                <input
                                    type="text"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                    placeholder={t('profilePage.branch')}
                                />
                            </div>

                            {/* Группа */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5">
                                    {t('profilePage.group')}
                                </label>
                                <input
                                    type="text"
                                    name="group_name"
                                    value={formData.group_name}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                    placeholder={t('profilePage.group')}
                                />
                            </div>

                            {/* Язык обучения */}
                            <div>
                                <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                    <Languages size={14} />
                                    {t('profilePage.language')}
                                </label>
                                <select
                                    name="language"
                                    value={formData.language}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                >
                                    <option value="ru">{t('profilePage.langRu')}</option>
                                    <option value="tj">{t('profilePage.langTj')}</option>
                                </select>
                            </div>

                            {/* Предмет (для учителей) */}
                            {profile?.role === 'teacher' && (
                                <div>
                                    <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                        <BookOpen size={14} />
                                        {t('profilePage.subject')}
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                        placeholder={t('profilePage.subject')}
                                    />
                                </div>
                            )}

                            {/* Кластер обучения (для учеников) */}
                            {profile?.role !== 'teacher' && profile?.role !== 'admin' && profile?.role !== 'super_admin' && (
                                <div>
                                    <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                                        <GraduationCap size={14} />
                                        Кластер обучения
                                    </label>
                                    <select
                                        name="cluster_id"
                                        value={formData.cluster_id}
                                        onChange={handleChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gaming-primary transition-colors cursor-pointer"
                                    >
                                        <option value="">{t('profilePage.notSpecified')}</option>
                                        {CLUSTERS_STRUCTURE.map(cluster => (
                                            <option key={cluster.id} value={cluster.id}>
                                                {`Кластер ${cluster.id}: ${cluster.titleRu}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Кнопка сохранения */}
            <div className="mt-8 flex justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-gaming-primary to-gaming-pink text-white rounded-xl font-medium transition-all shadow-lg shadow-gaming-primary/25 hover:shadow-gaming-pink/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {saving ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            {t('profilePage.saving')}
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            {t('profilePage.save')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
