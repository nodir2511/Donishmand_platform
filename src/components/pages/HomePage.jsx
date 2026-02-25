import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroSection from '../sections/HeroSection';
import CourseCard from '../features/CourseCard';
import ClusterSelect from '../features/ClusterSelect';
import OnboardingSubjectsSection from '../features/OnboardingSubjectsSection';
import { CLUSTERS_STRUCTURE, ALL_SUBJECTS_LIST } from '../../constants/data';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { syllabusService } from '../../services/syllabusService';

const PROGRESS_CACHE_KEY = 'donishmand_subject_progress';

const HomePage = () => {
    const { t, i18n } = useTranslation();
    const [activeClusterId, setActiveClusterId] = useState(0);
    const lang = i18n.resolvedLanguage || 'ru';
    const { profile } = useAuth();
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

    // Фоновая загрузка актуального прогресса из Supabase (SWR: revalidate)
    useEffect(() => {
        if (!profile) return;

        let cancelled = false;

        const loadProgress = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser?.id || cancelled) return;

                // Параллельно загружаем прогресс уроков и результаты тестов
                const [progressRes, testRes] = await Promise.all([
                    supabase
                        .from('user_lesson_progress')
                        .select('lesson_id')
                        .eq('user_id', authUser.id),
                    supabase
                        .from('user_test_results')
                        .select('lesson_id')
                        .eq('user_id', authUser.id),
                ]);

                if (progressRes.error) console.warn('Ошибка загрузки lesson_progress:', progressRes.error);
                if (testRes.error) console.warn('Ошибка загрузки test_results:', testRes.error);

                // Объединяем уникальные lesson_id
                const completedLessons = new Set();
                if (progressRes.data) progressRes.data.forEach(p => completedLessons.add(p.lesson_id));
                if (testRes.data) testRes.data.forEach(t => completedLessons.add(t.lesson_id));

                if (cancelled) return;

                if (completedLessons.size === 0) {
                    // Если прогресса нет — очищаем кеш
                    const empty = {};
                    setSubjectProgress(empty);
                    localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(empty));
                    return;
                }

                // Параллельно загружаем структуры ВСЕХ предметов
                const structureResults = await Promise.all(
                    ALL_SUBJECTS_LIST.map(async (subjectId) => {
                        try {
                            const structure = await syllabusService.getStructure(subjectId);
                            return { subjectId, structure };
                        } catch {
                            return { subjectId, structure: null };
                        }
                    })
                );

                if (cancelled) return;

                // Считаем прогресс по каждому предмету
                const progressMap = {};

                for (const { subjectId, structure } of structureResults) {
                    if (!structure?.sections) continue;

                    let totalLessons = 0;
                    let completedCount = 0;

                    for (const section of structure.sections) {
                        if (!section.topics) continue;
                        for (const topic of section.topics) {
                            if (!topic.lessons) continue;
                            for (const lesson of topic.lessons) {
                                totalLessons++;
                                if (completedLessons.has(lesson.id)) {
                                    completedCount++;
                                }
                            }
                        }
                    }

                    if (totalLessons > 0) {
                        progressMap[subjectId] = Math.round((completedCount / totalLessons) * 100);
                    }
                }

                if (cancelled) return;

                // Обновляем состояние и сохраняем в кеш для следующего визита
                setSubjectProgress(progressMap);
                localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(progressMap));
            } catch (err) {
                console.error('Ошибка загрузки прогресса:', err);
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
            return 'Мои предметы';
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

                {subjectsToDisplay.length > 0 ? (
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
                        <p className="text-white/60 text-lg">Нет доступных предметов</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default HomePage;
