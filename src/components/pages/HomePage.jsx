import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSection from '../sections/HeroSection';
import ClusterSelect from '../features/ClusterSelect';
import CourseCard from '../features/CourseCard';
import { CLUSTERS_STRUCTURE, ALL_SUBJECTS_LIST } from '../../constants/data';
import { useAuth } from '../../contexts/AuthContext';

const HomePage = () => {
    const { t, i18n } = useTranslation();
    const [activeClusterId, setActiveClusterId] = useState(0);
    const lang = i18n.resolvedLanguage || 'ru';
    const { profile } = useAuth();

    // Определяем доступные предметы в зависимости от роли
    const getSubjectsForRole = () => {
        // Суперадмин и Админ — видят все предметы
        if (profile?.role === 'super_admin' || profile?.role === 'admin') {
            if (activeClusterId === 0) return ALL_SUBJECTS_LIST;
            const cluster = CLUSTERS_STRUCTURE.find(c => c.id === activeClusterId);
            return cluster ? cluster.subjects : [];
        }

        // Учитель — видит только свой предмет
        if (profile?.role === 'teacher' && profile?.subject) {
            return [profile.subject];
        }

        // Ученик — по кластеру из профиля
        if (profile?.cluster_id) {
            const cluster = CLUSTERS_STRUCTURE.find(c => c.id === profile.cluster_id);
            return cluster ? cluster.subjects : ALL_SUBJECTS_LIST;
        }

        // По умолчанию (неавторизованные или без кластера) — показать по выбранному фильтру
        if (activeClusterId === 0) return ALL_SUBJECTS_LIST;
        const cluster = CLUSTERS_STRUCTURE.find(c => c.id === activeClusterId);
        return cluster ? cluster.subjects : [];
    };

    const subjectsToDisplay = getSubjectsForRole();

    // Определяем заголовок секции
    const getSectionTitle = () => {
        if (profile?.role === 'teacher' && profile?.subject) {
            return t('allSubjects'); // Учитель видит только один предмет
        }
        if (profile?.cluster_id && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            const cluster = CLUSTERS_STRUCTURE.find(c => c.id === profile.cluster_id);
            if (cluster) {
                return `${t('cluster')} ${cluster.id}: ${lang === 'ru' ? cluster.titleRu : cluster.titleTj}`;
            }
        }
        if (activeClusterId === 0) return t('allSubjects');
        const cluster = CLUSTERS_STRUCTURE.find(c => c.id === activeClusterId);
        return `${t('cluster')} ${activeClusterId}: ${lang === 'ru' ? cluster.titleRu : cluster.titleTj}`;
    };

    // Показывать ли переключатель кластеров
    // Учитель и ученик с кластером НЕ видят переключатель
    const showClusterSelect = !profile?.cluster_id || profile?.role === 'admin' || profile?.role === 'super_admin';
    const isTeacherSingleSubject = profile?.role === 'teacher' && profile?.subject;

    return (
        <main className="relative">
            <HeroSection />

            {/* Переключатель кластеров (скрыт для учеников с кластером и учителей) */}
            {showClusterSelect && !isTeacherSingleSubject && (
                <ClusterSelect
                    activeClusterId={activeClusterId}
                    setActiveClusterId={setActiveClusterId}
                />
            )}

            {/* Сетка предметов */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[600px] mt-10">
                <div className="flex items-end justify-between mb-8 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                            {getSectionTitle()}
                        </h2>
                        <p className="text-gaming-textMuted mt-2 text-lg">{t('popularSubtitle')}</p>
                    </div>
                </div>

                {subjectsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                        {subjectsToDisplay.map((subjectId, index) => (
                            <CourseCard
                                key={`${activeClusterId}-${subjectId}-${index}`}
                                subjectId={subjectId}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-white/60 text-lg">Нет доступных предметов</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default HomePage;
