import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Building } from 'lucide-react';
import AdminUsersTab from '../admin/AdminUsersTab';
import AdminBranchesTab from '../admin/AdminBranchesTab';

// Облегчённый AdminPage — только оболочка с вкладками
const AdminPage = () => {
    const { isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 container mx-auto max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                    {activeTab === 'users' ? 'Управление пользователями' : 'Управление филиалами'}
                </h1>
                <p className="text-gaming-textMuted">
                    {activeTab === 'users' ?
                        (isSuperAdmin
                            ? 'Полный доступ: управление ролями, правами и пользователями'
                            : 'Управление учителями и учениками')
                        : 'Управление списком филиалов для привязки классов'}
                </p>
            </div>

            {/* Вкладки (Tabs) */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
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
            </div>

            {/* Контент вкладки */}
            {activeTab === 'users' ? <AdminUsersTab /> : <AdminBranchesTab />}
        </div>
    );
};

export default AdminPage;
