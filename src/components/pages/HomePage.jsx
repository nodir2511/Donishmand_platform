import React, { useState } from 'react';
import HeroSection from '../sections/HeroSection';
import ClusterSelect from '../features/ClusterSelect';
import CourseCard from '../features/CourseCard';
import { CLUSTERS_STRUCTURE, ALL_SUBJECTS_LIST } from '../../constants/data';

const HomePage = ({ lang, t, setLang, userRole, setUserRole }) => {
    const [activeClusterId, setActiveClusterId] = useState(0);

    let subjectsToDisplay = [];
    let sectionTitle = "";

    if (activeClusterId === 0) {
        subjectsToDisplay = ALL_SUBJECTS_LIST;
        sectionTitle = t.allSubjects;
    } else {
        const cluster = CLUSTERS_STRUCTURE.find(c => c.id === activeClusterId);
        subjectsToDisplay = cluster ? cluster.subjects : [];
        sectionTitle = `${t.cluster} ${activeClusterId}: ${lang === 'ru' ? cluster.titleRu : cluster.titleTj}`;
    }

    return (
        <main className="relative">
            {/* Переключатель роли (Временный) */}
            <div className="absolute top-24 right-4 z-40 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 flex gap-1 shadow-2xl">
                <button
                    onClick={() => setUserRole('student')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userRole === 'student' ? 'bg-gaming-primary text-white shadow-lg' : 'text-gaming-textMuted hover:text-white hover:bg-white/5'}`}
                >
                    {t.studentRole}
                </button>
                <button
                    onClick={() => setUserRole('teacher')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userRole === 'teacher' ? 'bg-gaming-pink text-white shadow-lg' : 'text-gaming-textMuted hover:text-white hover:bg-white/5'}`}
                >
                    {t.teacherRole}
                </button>
            </div>

            <HeroSection lang={lang} t={t} />

            {/* КОНТЕЙНЕР ВКЛАДОК */}
            <ClusterSelect
                activeClusterId={activeClusterId}
                setActiveClusterId={setActiveClusterId}
                lang={lang}
                t={t}
            />

            {/* СЕТКА ПРЕДМЕТОВ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[600px] mt-10">
                <div className="flex items-end justify-between mb-8 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                            {sectionTitle}
                        </h2>
                        <p className="text-gaming-textMuted mt-2 text-lg">{t.popularSubtitle}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                    {subjectsToDisplay.map((subjectId, index) => (
                        <CourseCard
                            key={`${activeClusterId}-${subjectId}-${index}`}
                            subjectId={subjectId}
                            lang={lang}
                            t={t}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
};

export default HomePage;
