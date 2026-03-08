import React, { useState, useEffect } from 'react';
import { branchService } from '../../services/apiService';
import { Loader2, Trash2, MapPin, Building } from 'lucide-react';

const AdminBranchesTab = () => {
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [addingBranch, setAddingBranch] = useState(false);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Ошибка загрузки филиалов:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    const handleAddBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName.trim()) return;

        setAddingBranch(true);
        try {
            const newBranch = await branchService.createBranch(newBranchName);
            setBranches(prev => [...prev, newBranch].sort((a, b) => a.name.localeCompare(b.name)));
            setNewBranchName('');
            alert('Филиал успешно добавлен');
        } catch (error) {
            console.error('Ошибка добавления филиала:', error);
            alert(error.message || 'Ошибка добавления филиала');
        } finally {
            setAddingBranch(false);
        }
    };

    const handleDeleteBranch = async (branchId, branchName) => {
        if (!window.confirm(`Вы уверены, что хотите удалить филиал "${branchName}"? Классы этого филиала останутся, но без привязки к филиалу.`)) {
            return;
        }

        setUpdating(branchId);
        try {
            await branchService.deleteBranch(branchId);
            setBranches(prev => prev.filter(b => b.id !== branchId));
        } catch (error) {
            console.error('Ошибка удаления филиала:', error);
            alert('Не удалось удалить филиал');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="animate-fade-in max-w-2xl">
            {/* Форма добавления филиала */}
            <div className="bg-gaming-card border border-white/10 rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin size={22} className="text-gaming-accent" />
                    Добавить новый филиал
                </h2>
                <form onSubmit={handleAddBranch} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Название филиала (например: Душанбе, Худжанд)"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gaming-accent transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={addingBranch || !newBranchName.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-gaming-accent to-pink-500 text-white rounded-xl font-medium hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gaming-accent/20 flex items-center gap-2"
                    >
                        {addingBranch ? <Loader2 size={18} className="animate-spin" /> : 'Добавить'}
                    </button>
                </form>
            </div>

            {/* Список филиалов */}
            <div className="bg-gaming-card border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                {loadingBranches ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-gaming-accent" size={32} />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="p-12 text-center text-gaming-textMuted">
                        Нет филиалов. Создайте первый филиал выше.
                    </div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {branches.map(branch => (
                            <li key={branch.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gaming-accent/10 flex items-center justify-center border border-gaming-accent/20">
                                        <Building className="text-gaming-accent" size={20} />
                                    </div>
                                    <span className="font-medium text-white text-lg">{branch.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteBranch(branch.id, branch.name)}
                                    disabled={updating === branch.id}
                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all"
                                    title="Удалить филиал"
                                >
                                    {updating === branch.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AdminBranchesTab;
