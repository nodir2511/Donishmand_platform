import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { SUBJECT_CONFIG, SUBJECT_NAMES, ALL_SUBJECTS_LIST } from '../../constants/data';
import { Check, CheckCircle2, BookOpen } from 'lucide-react';

const OnboardingSubjectsSection = () => {
    const { i18n } = useTranslation();
    const { updateSelectedSubjects, profile } = useAuth();
    const [selected, setSelected] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const lang = i18n.resolvedLanguage || 'ru';

    const handleToggle = (subjectId) => {
        setSelected(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSave = async () => {
        if (selected.length === 0) return;
        setIsSaving(true);
        await updateSelectedSubjects(selected);
        setIsSaving(false);
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gaming-primary/20 flex items-center justify-center mb-6 ring-2 ring-gaming-primary/50 shadow-lg shadow-gaming-primary/30">
                <BookOpen className="text-gaming-primary w-8 h-8" />
            </div>

            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-lg">
                Добро пожаловать, {profile?.full_name || 'Ученик'}!
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl">
                Давайте настроим платформу под вас. Выберите предметы, которые вы планируете изучать:
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mb-12">
                {ALL_SUBJECTS_LIST.map(subjectId => {
                    const config = SUBJECT_CONFIG[subjectId];
                    if (!config) return null;
                    const Icon = config.icon;
                    const isSelected = selected.includes(subjectId);

                    return (
                        <div
                            key={subjectId}
                            onClick={() => handleToggle(subjectId)}
                            className={`relative cursor-pointer rounded-2xl p-6 flex flex-col items-center gap-4 transition-all duration-300 border-2
                                ${isSelected
                                    ? `bg-gaming-card/80 border-gaming-primary shadow-lg shadow-gaming-primary/20 scale-105`
                                    : `bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/20`}
                            `}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${isSelected ? 'scale-110' : ''} ${config.bg}`}>
                                <Icon size={28} className={config.color} />
                            </div>
                            <span className="font-medium text-white text-center">
                                {SUBJECT_NAMES[subjectId]?.[lang] || subjectId}
                            </span>

                            {/* Чекбокс индикатор */}
                            <div className={`absolute top-4 right-4 transition-all duration-300 ${isSelected ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-50'}`}>
                                <CheckCircle2 className="text-gaming-primary w-6 h-6" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleSave}
                disabled={selected.length === 0 || isSaving}
                className={`
                    px-12 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all duration-300 shadow-xl
                    ${selected.length > 0
                        ? 'bg-gaming-primary text-white hover:bg-gaming-primary-hover hover:scale-105 shadow-gaming-primary/30'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}
                `}
            >
                {isSaving ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Сохранение...
                    </>
                ) : (
                    <>
                        Продолжить <Check size={20} />
                    </>
                )}
            </button>
            <p className="mt-4 text-sm text-gray-500 max-w-md">
                В будущем вы сможете добавить или изменить список предметов через администратора.
            </p>
        </div>
    );
};

export default OnboardingSubjectsSection;
