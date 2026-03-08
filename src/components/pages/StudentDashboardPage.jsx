import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import {
    BarChart3, History, Settings, User
} from 'lucide-react';

// Ленивая загрузка вкладок
const DashboardTab = React.lazy(() => import('./dashboard/DashboardTab'));
const TestHistoryTab = React.lazy(() => import('./dashboard/TestHistoryTab'));
const SettingsTab = React.lazy(() => import('./dashboard/SettingsTab'));

// Индикатор загрузки для вкладок
const TabLoader = () => (
    <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gaming-primary/30 border-t-gaming-primary rounded-full animate-spin" />
    </div>
);

const TABS = [
    { id: 'dashboard', icon: BarChart3, labelKey: 'studentDashboard.tabDashboard' },
    { id: 'history', icon: History, labelKey: 'studentDashboard.tabHistory' },
    { id: 'settings', icon: Settings, labelKey: 'studentDashboard.tabSettings' },
];

const StudentDashboardPage = () => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Если не ученик — редирект на /profile
    if (profile && profile.role !== 'student') {
        return <Navigate to="/profile" replace />;
    }

    return (
        <div className="min-h-screen pb-12 px-4 container mx-auto max-w-6xl">
            {/* Шапка профиля */}
            <div className="mb-8 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Аватар */}
                    <div className="relative">
                        <UserAvatar
                            avatarUrl={profile?.avatar_url}
                            name={profile?.full_name || user?.email}
                            size="xl"
                            className="shadow-xl shadow-gaming-primary/20 border-2 border-white/10"
                        />
                        <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg border border-gaming-primary/50 bg-gaming-primary/10">
                            <User className="text-gaming-primary" size={18} />
                        </div>
                    </div>

                    {/* Имя и роль */}
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-heading font-bold text-white">
                            {profile?.full_name || user?.email}
                        </h1>
                        <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                            <span className="px-3 py-1 rounded-full text-xs font-medium border border-gaming-primary/50 bg-gaming-primary/10 text-gaming-primary">
                                {t('studentDashboard.student')}
                            </span>
                            <span className="text-gaming-textMuted text-sm">
                                {user?.email}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Вкладки */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${isActive
                                ? 'bg-gaming-primary text-white shadow-lg shadow-gaming-primary/25'
                                : 'bg-white/5 text-gaming-textMuted hover:text-white hover:bg-white/10 border border-white/5'
                                }`}
                        >
                            <Icon size={18} />
                            {t(tab.labelKey)}
                        </button>
                    );
                })}
            </div>

            {/* Контент вкладки */}
            <React.Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {activeTab === 'dashboard' && <DashboardTab />}
                    {activeTab === 'history' && <TestHistoryTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                </div>
            </React.Suspense>
        </div>
    );
};

export default StudentDashboardPage;
