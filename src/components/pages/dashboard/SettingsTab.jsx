import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService } from '../../../services/apiService';
import { CLUSTERS_STRUCTURE, AVATAR_OPTIONS } from '../../../constants/data';
import {
    User, Mail, Phone, Calendar, School, BookOpen,
    Save, Loader2, CheckCircle, AlertCircle, GraduationCap,
    Languages, Lock, Eye, EyeOff, Image, ShieldCheck, Info
} from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';

// Поля, которые блокируются после заполнения (ученик вводит 1 раз)
const LOCKED_FIELDS = ['full_name', 'phone', 'birth_date', 'school', 'grade', 'branch', 'cluster_id'];

const SettingsTab = () => {
    const { t } = useTranslation();
    const { user, profile, isAdmin } = useAuth();

    // Форма профиля
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        birth_date: '',
        school: '',
        grade: '',
        branch: '',
        group_name: '',
        language: 'tj',
        cluster_id: '',
    });

    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    // Смена пароля
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordStatus, setPasswordStatus] = useState(null);

    // Аватар
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [avatarSaving, setAvatarSaving] = useState(false);

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
                cluster_id: profile.cluster_id || '',
            });
            setSelectedAvatar(profile.avatar_url || null);
        }
    }, [profile]);

    // Проверяем, заблокировано ли поле (уже есть значение в БД, и пользователь не админ)
    const isFieldLocked = (fieldName) => {
        if (isAdmin) return false; // Админы могут менять всё
        if (!LOCKED_FIELDS.includes(fieldName)) return false;
        const savedValue = profile?.[fieldName];
        return savedValue !== null && savedValue !== undefined && savedValue !== '';
    };

    // Есть ли хоть одно незаполненное поле (чтобы показывать кнопку «Сохранить»)
    const hasUnfilledFields = LOCKED_FIELDS.some(field => {
        const savedValue = profile?.[field];
        return savedValue === null || savedValue === undefined || savedValue === '';
    });

    // Изменилось ли хоть одно незаблокированное поле
    const hasChanges = Object.entries(formData).some(([key, val]) => {
        if (isFieldLocked(key)) return false;
        const profileVal = profile?.[key] ?? '';
        return String(val) !== String(profileVal);
    });

    // Обработчик изменения полей
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (isFieldLocked(name)) return; // Дополнительная защита
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaveStatus(null);
    };

    // Сохранение профиля — только незаблокированные поля
    const handleSave = async () => {
        setSaving(true);
        setSaveStatus(null);
        try {
            // Собираем только те поля, которые НЕ заблокированы
            const updates = { updated_at: new Date().toISOString() };

            if (!isFieldLocked('full_name')) updates.full_name = formData.full_name;
            if (!isFieldLocked('phone')) updates.phone = formData.phone || null;
            if (!isFieldLocked('birth_date')) updates.birth_date = formData.birth_date || null;
            if (!isFieldLocked('school')) updates.school = formData.school || null;
            if (!isFieldLocked('grade')) updates.grade = formData.grade ? parseInt(formData.grade) : null;
            if (!isFieldLocked('branch')) updates.branch = formData.branch || null;
            if (!isFieldLocked('cluster_id')) updates.cluster_id = formData.cluster_id ? parseInt(formData.cluster_id) : null;

            // «language» и «group_name» всегда можно менять
            updates.language = formData.language;
            updates.group_name = formData.group_name || null;

            const cleanUpdates = cleanUndefined(updates);

            await studentService.updateProfile(user.id, updates);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    // Смена пароля
    const handlePasswordChange = async () => {
        if (passwordData.newPassword.length < 6) {
            setPasswordStatus('short');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordStatus('mismatch');
            return;
        }

        setPasswordSaving(true);
        setPasswordStatus(null);
        try {
            await studentService.changePassword(passwordData.newPassword);
            setPasswordStatus('success');
            setPasswordData({ newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordStatus(null), 3000);
        } catch (error) {
            console.error('Ошибка смены пароля:', error);
            setPasswordStatus('error');
        } finally {
            setPasswordSaving(false);
        }
    };

    // Выбор аватара
    const handleAvatarSelect = async (avatarId) => {
        setAvatarSaving(true);
        try {
            await studentService.updateAvatar(avatarId);
            setSelectedAvatar(avatarId);
            setShowAvatarPicker(false);
            window.location.reload();
        } catch (error) {
            console.error('Ошибка сохранения аватара:', error);
        } finally {
            setAvatarSaving(false);
        }
    };

    // Вспомогательная функция для рендера инпута с логикой блокировки
    const renderInput = ({ fieldName, type = 'text', placeholder, icon: Icon, label, children }) => {
        const locked = isFieldLocked(fieldName);
        const baseClass = 'w-full rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none transition-colors';
        const activeClass = 'bg-black/30 border border-white/10 focus:border-gaming-primary';
        const lockedClass = 'bg-black/20 border border-white/5 text-gray-400 cursor-not-allowed select-none opacity-70';

        return (
            <div>
                <label className="block text-sm text-gaming-textMuted mb-1.5 flex items-center gap-1.5">
                    {Icon && <Icon size={14} />}
                    {label}
                    {locked && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-gaming-gold/70 font-normal">
                            <Lock size={10} />
                            Зафиксировано
                        </span>
                    )}
                </label>

                {children ? (
                    // Кастомный элемент (select и т.д.)
                    React.cloneElement(children, {
                        disabled: locked,
                        className: `${baseClass} ${locked ? lockedClass : activeClass} cursor-pointer`,
                        onChange: locked ? undefined : children.props.onChange,
                    })
                ) : (
                    <input
                        type={type}
                        name={fieldName}
                        value={formData[fieldName]}
                        onChange={handleChange}
                        disabled={locked}
                        placeholder={locked ? '' : placeholder}
                        className={`${baseClass} ${locked ? lockedClass : activeClass} ${type === 'date' ? '[color-scheme:dark]' : ''}`}
                    />
                )}

                {locked && !isAdmin && (
                    <p className="mt-1 text-xs text-gaming-textMuted/60 flex items-center gap-1">
                        <ShieldCheck size={10} />
                        Для изменения обратитесь к администратору
                    </p>
                )}
            </div>
        );
    };

    // Показываем кнопку «Сохранить» если есть незаблокированные поля с изменениями
    const canSave = (isAdmin || hasUnfilledFields) && hasChanges;

    return (
        <div className="space-y-6">
            {/* Уведомление о сохранении профиля */}
            {saveStatus && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in-up ${saveStatus === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {saveStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-medium">
                        {saveStatus === 'success' ? t('profilePage.saved') : t('profilePage.error')}
                    </span>
                </div>
            )}

            {/* Баннер: поля зафиксированы (только для учеников, не админов) */}
            {!isAdmin && !hasUnfilledFields && (
                <div className="p-4 rounded-xl border border-gaming-gold/20 bg-gaming-gold/5 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-gaming-gold shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gaming-gold">Данные зафиксированы</p>
                        <p className="text-xs text-gaming-textMuted mt-0.5">
                            Все поля профиля уже заполнены. Изменить их может только администратор.
                        </p>
                    </div>
                </div>
            )}

            {/* Baнер: есть незаполненные поля */}
            {!isAdmin && hasUnfilledFields && (
                <div className="p-4 rounded-xl border border-gaming-accent/20 bg-gaming-accent/5 flex items-start gap-3">
                    <Info size={20} className="text-gaming-accent shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gaming-accent">Заполните профиль</p>
                        <p className="text-xs text-gaming-textMuted mt-0.5">
                            После первого сохранения данные будут зафиксированы и не смогут быть изменены учеником.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Смена аватара */}
                <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
                        <Image size={20} className="text-gaming-accent" />
                        {t('studentDashboard.changeAvatar')}
                    </h2>

                    <div className="flex items-center gap-4 mb-4">
                        <UserAvatar
                            avatarUrl={selectedAvatar}
                            name={profile?.full_name || user?.email}
                            size="lg"
                            className="shadow-lg border-2 border-white/10"
                        />

                        <button
                            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gaming-textMuted hover:text-white hover:border-gaming-primary transition-all"
                        >
                            {t('studentDashboard.chooseAvatar')}
                        </button>
                    </div>

                    {showAvatarPicker && (
                        <div className="grid grid-cols-4 gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
                            {AVATAR_OPTIONS.map(avatar => (
                                <button
                                    key={avatar.id}
                                    onClick={() => handleAvatarSelect(avatar.id)}
                                    disabled={avatarSaving}
                                    className={`w-full aspect-square rounded-xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 border-2 ${selectedAvatar === avatar.id
                                        ? 'border-gaming-accent shadow-lg shadow-gaming-accent/30'
                                        : 'border-transparent hover:border-white/20'
                                        } ${avatarSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                >
                                    {avatar.emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Личная информация */}
                <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-heading font-bold text-white mb-6 flex items-center gap-2">
                        <User size={20} className="text-gaming-primary" />
                        {t('profilePage.personalInfo')}
                    </h2>

                    <div className="space-y-4">
                        {/* ФИО */}
                        {renderInput({
                            fieldName: 'full_name',
                            label: t('profilePage.fullName'),
                            icon: User,
                            placeholder: t('profilePage.fullName'),
                        })}

                        {/* Email (только чтение — всегда) */}
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
                        {renderInput({
                            fieldName: 'phone',
                            type: 'tel',
                            label: t('profilePage.phone'),
                            icon: Phone,
                            placeholder: '+992 XXX XX XX XX',
                        })}

                        {/* Дата рождения */}
                        {renderInput({
                            fieldName: 'birth_date',
                            type: 'date',
                            label: t('profilePage.birthDate'),
                            icon: Calendar,
                        })}
                    </div>
                </div>

                {/* Информация об обучении */}
                <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-heading font-bold text-white mb-6 flex items-center gap-2">
                        <GraduationCap size={20} className="text-gaming-accent" />
                        {t('profilePage.educationInfo')}
                    </h2>

                    <div className="space-y-4">
                        {/* Школа */}
                        {renderInput({
                            fieldName: 'school',
                            label: t('profilePage.school'),
                            icon: School,
                            placeholder: t('profilePage.school'),
                        })}

                        {/* Класс */}
                        {renderInput({
                            fieldName: 'grade',
                            label: t('profilePage.grade'),
                            icon: BookOpen,
                            children: (
                                <select
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                >
                                    <option value="">{t('profilePage.notSpecified')}</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            )
                        })}

                        {/* Филиал */}
                        {renderInput({
                            fieldName: 'branch',
                            label: t('profilePage.branch'),
                            placeholder: t('profilePage.branch'),
                        })}

                        {/* Язык обучения — ВСЕГДА можно менять */}
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

                        {/* Кластер */}
                        {renderInput({
                            fieldName: 'cluster_id',
                            label: t('studentDashboard.cluster'),
                            icon: GraduationCap,
                            children: (
                                <select
                                    name="cluster_id"
                                    value={formData.cluster_id}
                                    onChange={handleChange}
                                >
                                    <option value="">{t('profilePage.notSpecified')}</option>
                                    {CLUSTERS_STRUCTURE.map(cluster => (
                                        <option key={cluster.id} value={cluster.id}>
                                            {`Кластер ${cluster.id}: ${cluster.titleRu}`}
                                        </option>
                                    ))}
                                </select>
                            )
                        })}
                    </div>
                </div>

                {/* Смена пароля */}
                <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-heading font-bold text-white mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-gaming-pink" />
                        {t('studentDashboard.changePassword')}
                    </h2>

                    {passwordStatus && (
                        <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-sm ${passwordStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                            'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            }`}>
                            {passwordStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {passwordStatus === 'success' && t('studentDashboard.passwordChanged')}
                            {passwordStatus === 'mismatch' && t('studentDashboard.passwordMismatch')}
                            {passwordStatus === 'short' && t('studentDashboard.passwordTooShort')}
                            {passwordStatus === 'error' && t('studentDashboard.passwordError')}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm text-gaming-textMuted mb-1.5">
                                {t('studentDashboard.newPassword')}
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => { setPasswordData(p => ({ ...p, newPassword: e.target.value })); setPasswordStatus(null); }}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-gaming-textMuted hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm text-gaming-textMuted mb-1.5">
                                {t('studentDashboard.confirmPassword')}
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => { setPasswordData(p => ({ ...p, confirmPassword: e.target.value })); setPasswordStatus(null); }}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gaming-primary transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            onClick={handlePasswordChange}
                            disabled={passwordSaving || !passwordData.newPassword}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gaming-pink/10 text-gaming-pink border border-gaming-pink/20 rounded-xl text-sm font-medium hover:bg-gaming-pink hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                            {t('studentDashboard.changePasswordBtn')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Кнопка сохранения — показывается только если есть что сохранять */}
            {canSave && (
                <div className="flex justify-center animate-fade-in-up">
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
            )}
        </div>
    );
};

export default SettingsTab;
