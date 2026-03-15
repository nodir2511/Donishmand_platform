import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroSection from '../sections/HeroSection';
import CourseCard from '../features/CourseCard';
import ClusterSelect from '../features/ClusterSelect';
import OnboardingSubjectsSection from '../features/OnboardingSubjectsSection';
import { CLUSTERS_STRUCTURE, ALL_SUBJECTS_LIST } from '../../constants/data';
import { useAuth } from '../../contexts/AuthContext';

// Скелетон-заглушка для карточки курса (отображается при загрузке)
const CourseCardSkeleton = () => (
    <div className="block relative bg-gaming-card rounded-3xl p-6 border border-white/5 shadow-lg shadow-black/20 overflow-hidden animate-pulse">
        <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5" />
            <div className="w-8 h-8 rounded-full bg-white/5" />
        </div>
        <div className="h-6 w-3/4 bg-white/5 rounded-lg mb-4" />
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1.5">
                <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full" />
        </div>
    </div>
);
import { supabase } from '../../services/supabase';
import { studentService } from '../../services/apiService';

const PROGRESS_CACHE_KEY = 'donishmand_subject_progress';

const HomePage = () => {
    const { t, i18n } = useTranslation();
    const [activeClusterId, setActiveClusterId] = useState(0);
    const lang = i18n.resolvedLanguage || 'ru';
    const { profile, loading: authLoading } = useAuth();
    const location = useLocation();

    // SWR: мгновенная инициализация прогресса из localStorage-кеша
    const [subjectProgress, setSubjectProgress] = useState(() => {
        try {
            const cached = localStorage.getItem(PROGRESS_CACHE_KEY);
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        if (location.hash === '#courses-section') {
            setTimeout(() => {
                document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [location]);

    // Определяем, для каких предметов нужно считать прогресс
    // (только отображаемые, а не все 12)
    const getSubjectsForProgress = () => {
        if (!profile) return [];
        // Прогресс-бар показываем только ученикам
        if (profile.role === 'teacher' || profile.role === 'admin' || profile.role === 'super_admin') return [];
        // Ученик — только выбранные предметы
        if (profile.selected_subjects?.length > 0) return profile.selected_subjects;
        // Если предметы не выбраны — прогресс не считаем (будет онбординг)
        return [];
    };

    // Фоновая загрузка актуального прогресса из Supabase (SWR: revalidate)
    useEffect(() => {
        if (!profile) return;

        const subjectsForProgress = getSubjectsForProgress();
        // Прогресс нужен только ученикам с выбранными предметами
        if (subjectsForProgress.length === 0) return;

        let cancelled = false;

        const loadProgress = async () => {
            try {
                // Вызываем новую серверную функцию, которая делает всё за один раз
                const data = await studentService.getDashboardStats(subjectsForProgress);
                
                if (cancelled || !data) return;

                // Извлекаем прогресс по предметам
                const progressMap = {};
                (data.subjects || []).forEach(s => {
                    progressMap[s.subjectId] = s.progress;
                });

                // Сохраняем расширенную статистику (уроки, темы, разделы) в глобальный кеш
                // Это ускорит загрузку SubjectPage, SectionPage и TopicPage
                if (data.statsMap || data.lessonStats) {
                    const lessonsStats = data.lessonStats || {};
                    const hierarchyStats = data.statsMap || {};
                    // Объединяем их для совместимости
                    const fullStatsMap = { ...lessonsStats, ...hierarchyStats };
                    localStorage.setItem('donishmand_topic_stats', JSON.stringify(fullStatsMap));
                }

                setSubjectProgress(progressMap);
                localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(progressMap));
            } catch (err) {
                console.error('Ошибка загрузки прогресса через RPC:', err);
            }
        };

        loadProgress();

        return () => { cancelled = true; };
    }, [profile]);

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

        // Выбранные предметы ученика
        if (profile?.selected_subjects && profile.selected_subjects.length > 0) {
            return profile.selected_subjects;
        }

        // По умолчанию (неавторизованные) — показать по выбранному фильтру
        if (activeClusterId === 0) return ALL_SUBJECTS_LIST;
        const cluster = CLUSTERS_STRUCTURE.find(c => c.id === activeClusterId);
        return cluster ? cluster.subjects : [];
    };

    const subjectsToDisplay = getSubjectsForRole();
    const isStudent = profile?.role === 'student' || !profile?.role;
    const hasSelectedSubjects = profile?.selected_subjects && profile.selected_subjects.length > 0;
    const isTeacher = profile?.role === 'teacher';
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    const isGuest = !profile;

    // Определяем заголовок секции
    const getSectionTitle = () => {
        if (isTeacher && profile?.subject) {
            return t('allSubjects'); // Учитель видит только один предмет
        }
        if (isStudent && hasSelectedSubjects) {
            return t('mySubjects');
        }
        if (activeClusterId === 0) return t('allSubjects');
        const cluster = CLUSTERS_STRUCTURE.find(c => c.id === activeClusterId);
        return `${t('cluster')} ${activeClusterId}: ${lang === 'ru' ? cluster?.titleRu : cluster?.titleTj}`;
    };

    // Показывать ли переключатель кластеров
    // Показываем ТОЛЬКО гостям
    const showClusterSelect = isGuest;

    // Скрываем HeroSection для всех авторизованных
    const showHeroSection = isGuest;

    // Если это студент, который еще не выбрал предметы, показываем ТОЛЬКО онбординг
    if (!isGuest && isStudent && !hasSelectedSubjects) {
        return (
            <main className="relative">
                <OnboardingSubjectsSection />
            </main>
        );
    }

    return (
        <main className="relative">
            {showHeroSection && <HeroSection />}

            {showClusterSelect && (
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

                {/* Скелетон-загрузка пока профиль не определён */}
                {authLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <CourseCardSkeleton key={`skeleton-${i}`} />
                        ))}
                    </div>
                ) : subjectsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                        {subjectsToDisplay.map((subjectId, index) => (
                            <CourseCard
                                key={`${activeClusterId}-${subjectId}-${index}`}
                                subjectId={subjectId}
                                progress={subjectProgress[subjectId] || 0}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-white/60 text-lg">{t('noSubjectsAvailable')}</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default HomePage;
