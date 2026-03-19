import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminUsersTab from '../admin/AdminUsersTab';
import AdminBranchesTab from '../admin/AdminBranchesTab';
import AdminNotificationsTab from '../admin/AdminNotificationsTab';
import { User, Building, Bell } from 'lucide-react';

const AdminPage = () => {
    const { isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    const getTitle = () => {
        switch (activeTab) {
            case 'users': return 'Управление пользователями';
            case 'branches': return 'Управление филиалами';
            case 'notifications': return 'Центр уведомлений и анонсов';
            default: return 'Администрирование';
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 container mx-auto max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                    {getTitle()}
                </h1>
                <p className="text-gaming-textMuted">
                    {activeTab === 'users' ?
                        (isSuperAdmin
                            ? 'Полный доступ: управление ролями, правами и пользователями'
                            : 'Управление учителями и учениками')
                        : activeTab === 'branches' 
                        ? 'Управление списком филиалов для привязки классов'
                        : 'Массовая рассылка уведомлений и создание анонсов'}
                </p>
            </div>

            {/* Вкладки (Tabs) */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'users'
                        ? 'bg-gaming-primary text-white shadow-lg shadow-gaming-primary/25'
                        : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                        }`}
                >
                    <User size={18} /> Пользователи
                </button>
                <button
                    onClick={() => setActiveTab('branches')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'branches'
                        ? 'bg-gaming-accent text-white shadow-lg shadow-gaming-accent/25'
                        : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                        }`}
                >
                    <Building size={18} /> Филиалы
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'notifications'
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                        : 'bg-black/30 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                        }`}
                >
                    <Bell size={18} /> Уведомления
                </button>
            </div>

            {/* Контент вкладки */}
            <div className="animate-fade-in">
                {activeTab === 'users' && <AdminUsersTab />}
                {activeTab === 'branches' && <AdminBranchesTab />}
                {activeTab === 'notifications' && <AdminNotificationsTab />}
            </div>
        </div>
    );
};

export default AdminPage;
