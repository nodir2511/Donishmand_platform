import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { classService } from '../../../services/classService';
import { useTranslation } from 'react-i18next';
import {
    Users, ChevronLeft, Loader2, AlertCircle, TrendingUp,
    Award, BookOpen, Settings, Medal, Calendar, Trash2
} from 'lucide-react';
import ClassStudentsTab from './tabs/ClassStudentsTab';
import ClassLeaderboardTab from './tabs/ClassLeaderboardTab';
import ClassGradesTab from './tabs/ClassGradesTab';
import ClassSettingsTab from './tabs/ClassSettingsTab';
import ClassStatisticsTab from './tabs/ClassStatisticsTab';

const ClassDetailsPage = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { t } = useTranslation();

    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('grades'); // 'grades', 'students', 'statistics', 'homework'

    const isTeacherOrAdmin = ['teacher', 'admin', 'super_admin'].includes(profile?.role);
    const isStudent = profile?.role === 'student';

    useEffect(() => {
        if (isStudent) {
            setActiveTab('grades'); // Ученики по дефолту видят свои оценки
        }
    }, [isStudent]);

    useEffect(() => {
        if (classId) {
            fetchClassDetails();
        }
    }, [classId]);

    const fetchClassDetails = async () => {
        setLoading(true);
        try {
            const data = await classService.getClassDetails(classId);
            if (!data) throw new Error('Класс не найден');

            // Если ученик, проверим состоит ли он в классе
            if (isStudent) {
                const myClasses = await classService.getStudentClasses(user.id);
                if (!myClasses.find(c => c.id === classId)) {
                    throw new Error('Вы не состоите в этом классе');
                }
            }

            setClassData(data);
        } catch (err) {
            console.error('Ошибка загрузки класса:', err);
            setError(err.message || 'Ошибка загрузки данных класса');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClass = async () => {
        if (!window.confirm(`Вы уверены, что хотите удалить класс "${classData.name}"? Это действие необратимо.`)) return;

        try {
            await classService.deleteClass(classId);
            navigate('/classes');
        } catch (err) {
            console.error('Ошибка удаления:', err);
            alert('Не удалось удалить класс');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex justify-center items-center">
                <Loader2 className="animate-spin text-gaming-primary" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <button
                    onClick={() => navigate('/classes')}
                    className="flex items-center gap-2 text-gaming-textMuted hover:text-white mb-6 transition-colors"
                >
                    <ChevronLeft size={20} /> Назад к классам
                </button>
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl flex items-center gap-4">
                    <AlertCircle size={24} />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Навигация назад */}
            <button
                onClick={() => navigate('/classes')}
                className="flex items-center gap-2 text-gaming-textMuted hover:text-white mb-6 transition-colors group"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Назад к классам
            </button>

            {/* Шапка класса */}
            <div className="bg-gaming-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden animate-fade-in-up">
                {/* Декоративное свечение */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gaming-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gaming-primary/20 rounded-xl text-gaming-primary">
                                    <BookOpen size={24} />
                                </div>
                                <h1 className="text-3xl font-heading font-bold text-white pr-2">
                                    {classData.name}
                                </h1>
                            </div>

                            {isTeacherOrAdmin && (
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings'
                                        ? 'bg-gaming-primary text-white shadow-lg shadow-gaming-primary/25'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                                        }`}
                                >
                                    <Settings size={14} /> Управление классом
                                </button>
                            )}
                        </div>
                        <div className="text-gaming-textMuted flex items-center gap-2">
                            <Users size={16} />
                            <span>{isTeacherOrAdmin ? `${classData.class_members?.[0]?.count || 0} учеников` : `Учитель: ${classData.teacher?.full_name || 'Неизвестно'}`}</span>
                        </div>
                    </div>

                    {/* Кнопка удаления для учителя */}
                    {isTeacherOrAdmin && classData.teacher_id === user.id && (
                        <button
                            onClick={handleDeleteClass}
                            className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                            <Trash2 size={18} />
                            Удалить класс
                        </button>
                    )}
                </div>

                {/* Описание класса */}
                {classData.description && (
                    <div className="relative z-10 mt-6 p-4 bg-black/20 rounded-xl border border-white/5 text-sm text-gray-300 whitespace-pre-wrap">
                        {classData.description}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Левая колонка - Основной контент */}
                <div className="lg:col-span-2">
                    {/* Вкладки (Tabs) */}
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <button
                            onClick={() => setActiveTab('grades')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'grades'
                                ? 'bg-gaming-purple text-white shadow-lg shadow-gaming-purple/25'
                                : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                                }`}
                        >
                            <Award size={18} /> {isStudent ? 'Мои оценки' : 'Оценки'}
                        </button>

                        {isTeacherOrAdmin && (
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'students'
                                    ? 'bg-gaming-primary text-white shadow-lg shadow-gaming-primary/25'
                                    : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                                    }`}
                            >
                                <Users size={18} /> Ученики
                            </button>
                        )}

                        {isTeacherOrAdmin && (
                            <button
                                onClick={() => setActiveTab('statistics')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'statistics'
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                                    : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                                    }`}
                            >
                                <TrendingUp size={18} /> Статистика
                            </button>
                        )}

                    </div>

                    {/* Контент активной вкладки */}
                    <div className="animate-fade-in">
                        {activeTab === 'grades' && (
                            <ClassGradesTab classId={classId} isStudent={isStudent} studentId={isStudent ? user.id : null} />
                        )}

                        {activeTab === 'students' && isTeacherOrAdmin && (
                            <ClassStudentsTab classId={classId} />
                        )}

                        {activeTab === 'statistics' && isTeacherOrAdmin && (
                            <ClassStatisticsTab classData={classData} />
                        )}

                        {activeTab === 'settings' && isTeacherOrAdmin && (
                            <ClassSettingsTab
                                classData={classData}
                                onUpdate={(updatedData) => setClassData(prev => ({ ...prev, ...updatedData }))}
                            />
                        )}
                    </div>
                </div>

                {/* Правая колонка - Лидерборд (всегда отображается) */}
                <div className="lg:col-span-1 border-t border-white/10 pt-8 lg:pt-0 lg:border-t-0 lg:border-l lg:border-white/5 lg:pl-8">
                    <ClassLeaderboardTab classId={classId} />
                </div>
            </div>
        </div>
    );
};

export default ClassDetailsPage;
