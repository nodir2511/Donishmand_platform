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
    // const { isTeacher } = useAuth(); // Можно использовать если нужно

    let subjectsToDisplay = [];
    let sectionTitle = "";

    if (activeClusterId === 0) {
        subjectsToDisplay = ALL_SUBJECTS_LIST;
        sectionTitle = t('allSubjects');
    } else {
        const cluster = CLUSTERS_STRUCTURE.find(c => c.id === activeClusterId);
        subjectsToDisplay = cluster ? cluster.subjects : [];
        sectionTitle = `${t('cluster')} ${activeClusterId}: ${lang === 'ru' ? cluster.titleRu : cluster.titleTj}`;
    }

    return (
        <main className="relative">
            <HeroSection />

            {/* КОНТЕЙНЕР ВКЛАДОК */}
            <ClusterSelect
                activeClusterId={activeClusterId}
                setActiveClusterId={setActiveClusterId}
            />

            {/* СЕТКА ПРЕДМЕТОВ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[600px] mt-10">
                <div className="flex items-end justify-between mb-8 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                            {sectionTitle}
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
