import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, Shield, ShieldCheck, ShieldAlert, User } from 'lucide-react';

const AdminPage = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        setUpdating(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'super_admin': return <ShieldAlert className="text-red-500" size={20} />;
            case 'admin': return <ShieldCheck className="text-gaming-accent" size={20} />;
            case 'teacher': return <Shield className="text-gaming-primary" size={20} />;
            default: return <User className="text-gray-400" size={20} />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'super_admin': return 'border-red-500/50 bg-red-500/10 text-red-400';
            case 'admin': return 'border-gaming-accent/50 bg-gaming-accent/10 text-gaming-accent';
            case 'teacher': return 'border-gaming-primary/50 bg-gaming-primary/10 text-gaming-primary';
            default: return 'border-white/10 bg-white/5 text-gray-400';
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="animate-spin text-gaming-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 container mx-auto max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                    Управление пользователями
                </h1>
                <p className="text-gaming-textMuted">
                    Управление ролями и доступом пользователей
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Поиск пользователей..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gaming-card border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-gaming-primary transition-colors"
                />
            </div>

            {/* Users List */}
            <div className="bg-gaming-card border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-gaming-textMuted font-medium">Пользователь</th>
                                <th className="p-4 text-gaming-textMuted font-medium">Email</th>
                                <th className="p-4 text-gaming-textMuted font-medium">Роль</th>
                                <th className="p-4 text-gaming-textMuted font-medium">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gaming-primary/20 flex items-center justify-center border border-gaming-primary/30">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">
                                                    {user.full_name || 'Без имени'}
                                                </div>
                                                <div className="text-xs text-gaming-textMuted">
                                                    ID: {user.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300">
                                        {user.email || 'Нет email'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {updating === user.id ? (
                                                <Loader2 className="animate-spin text-gaming-primary" size={20} />
                                            ) : (
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-gray-300 focus:outline-none focus:border-gaming-primary cursor-pointer hover:bg-black/60 transition-colors"
                                                >
                                                    <option value="user">Пользователь</option>
                                                    <option value="teacher">Учитель</option>
                                                    <option value="admin">Админ</option>
                                                    <option value="super_admin">Супер Админ</option>
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gaming-textMuted">
                        Пользователи не найдены
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
