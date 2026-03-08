import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Filter, ChevronDown, Clock, MapPin, Globe, Loader } from 'lucide-react';
import { statisticsService } from '../../services/apiService';
import { SUBJECTS_DATA } from '../../constants/data';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../layout/Navbar';
import UserAvatar from '../common/UserAvatar';

const LeaderboardPage = () => {
    const { profile } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [scope, setScope] = useState('global'); // 'global' | 'branch'
    const [period, setPeriod] = useState('all'); // 'day' | 'week' | 'month' | 'all'
    const [subject, setSubject] = useState('all'); // 'all' | subject id
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, [scope, period, subject]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await statisticsService.getGlobalLeaderboard({
                period: period,
                subjectId: subject,
                branchId: scope === 'branch' ? profile?.branch : 'all'
            });
            setLeaderboard(data || []);
        } catch (error) {
            console.error('Ошибка загрузки лидерборда:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankStyle = (index) => {
        switch (index) {
            case 0: return 'bg-yellow-500 text-yellow-900 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
            case 1: return 'bg-gray-300 text-gray-800 border-gray-200 shadow-[0_0_15px_rgba(209,213,219,0.5)]';
            case 2: return 'bg-amber-600 text-amber-100 border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)]';
            default: return 'bg-white/5 text-gray-300 border-white/10';
        }
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Crown className="w-5 h-5" />;
            case 1: return <Medal className="w-5 h-5 text-gray-700" />;
            case 2: return <Medal className="w-5 h-5 text-amber-200" />;
            default: return <span>#{index + 1}</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3">
                        <Trophy className="w-8 h-8 md:w-10 md:h-10 text-gaming-primary" />
                        Глобальная Доска Почёта
                    </h1>
                    <p className="text-gray-400 mt-2">Рейтинг лучших учеников платформы</p>
                </div>

                {/* Filters Desktop/Mobile scrollable */}
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    
                    {/* Scope Toggle */}
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 shrink-0">
                        <button
                            onClick={() => setScope('global')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${scope === 'global' ? 'bg-gaming-primary text-white shadow-gaming-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Globe className="w-4 h-4" /> Платформа
                        </button>
                        <button
                            onClick={() => setScope('branch')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${scope === 'branch' ? 'bg-gaming-primary text-white shadow-gaming-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <MapPin className="w-4 h-4" /> Мой филиал
                        </button>
                    </div>

                    {/* Period Select */}
                    <div className="relative group min-w-[140px] shrink-0">
                        <select 
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full appearance-none bg-[#151525] border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-gaming-primary focus:ring-1 focus:ring-gaming-primary transition-colors cursor-pointer text-white"
                        >
                            <option value="day">За сегодня</option>
                            <option value="week">За неделю</option>
                            <option value="month">За месяц</option>
                            <option value="all">За всё время</option>
                        </select>
                        <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Subject Select */}
                    <div className="relative group min-w-[160px] shrink-0">
                        <select 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full appearance-none bg-[#151525] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gaming-primary focus:ring-1 focus:ring-gaming-primary transition-colors cursor-pointer text-white"
                        >
                            <option value="all">📚 Все предметы</option>
                            {SUBJECTS_DATA.map(subj => (
                                <option key={subj.id} value={subj.id}>
                                    {subj.icon} {subj.nameRu}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Top 3 Spotlight */}
            {!loading && leaderboard.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
                    {/* Rank 2 */}
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-[#151525] border-t-4 border-gray-300 rounded-2xl p-6 flex flex-col items-center relative shadow-[0_-5px_20px_rgba(209,213,219,0.1)] order-2 md:order-1 h-[280px] justify-between"
                    >
                        <div className="absolute top-4 left-4 w-8 h-8 bg-gray-300 text-gray-900 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white/20">2</div>
                        <div className="w-24 h-24 rounded-full border-4 border-gray-300 overflow-hidden mt-6 bg-white/5 shrink-0 flex items-center justify-center">
                            <UserAvatar avatarUrl={leaderboard[1].avatar_url} name={leaderboard[1].full_name} size="xl" className="w-full h-full text-5xl !rounded-full" />
                        </div>
                        <div className="text-center mt-4">
                            <h3 className="font-heading font-bold text-lg line-clamp-1" title={leaderboard[1].full_name}>{leaderboard[1].full_name}</h3>
                            <p className="text-gaming-accent font-mono font-bold text-xl mt-1 flex items-center justify-center gap-1">
                                <span className="text-xl">💰</span> {leaderboard[1].total_coins?.toLocaleString()}
                            </p>
                        </div>
                    </motion.div>

                    {/* Rank 1 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-gradient-to-b from-[#1a1a3a] to-[#151525] border-t-4 border-yellow-400 rounded-2xl p-6 flex flex-col items-center relative shadow-[0_-5px_30px_rgba(234,179,8,0.2)] md:-mt-8 order-1 md:order-2 h-[320px] justify-between z-10"
                    >
                        <Crown className="absolute -top-6 text-yellow-500 w-12 h-12 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
                        <div className="absolute top-4 left-4 w-10 h-10 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white/20">1</div>
                        <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden mt-8 shadow-[0_0_20px_rgba(234,179,8,0.3)] bg-white/5 shrink-0 flex items-center justify-center">
                            <UserAvatar avatarUrl={leaderboard[0].avatar_url} name={leaderboard[0].full_name} size="xl" className="w-full h-full text-6xl !rounded-full" />
                        </div>
                        <div className="text-center mt-4">
                            <h3 className="font-heading font-bold text-xl line-clamp-1" title={leaderboard[0].full_name}>{leaderboard[0].full_name}</h3>
                            <p className="text-yellow-400 font-mono font-bold text-2xl mt-1 flex items-center justify-center gap-1">
                                <span className="text-2xl drop-shadow-md">💰</span> {leaderboard[0].total_coins?.toLocaleString()}
                            </p>
                        </div>
                    </motion.div>

                    {/* Rank 3 */}
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-[#151525] border-t-4 border-amber-600 rounded-2xl p-6 flex flex-col items-center relative shadow-[0_-5px_20px_rgba(217,119,6,0.1)] order-3 h-[260px] justify-between"
                    >
                        <div className="absolute top-4 left-4 w-8 h-8 bg-amber-600 text-amber-100 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white/20">3</div>
                        <div className="w-20 h-20 rounded-full border-4 border-amber-600 overflow-hidden mt-6 bg-white/5 shrink-0 flex items-center justify-center">
                            <UserAvatar avatarUrl={leaderboard[2].avatar_url} name={leaderboard[2].full_name} size="lg" className="w-full h-full text-4xl !rounded-full" />
                        </div>
                        <div className="text-center mt-2">
                            <h3 className="font-heading font-bold text-base line-clamp-1" title={leaderboard[2].full_name}>{leaderboard[2].full_name}</h3>
                            <p className="text-amber-500 font-mono font-bold text-lg mt-1 flex items-center justify-center gap-1">
                                <span className="text-lg">💰</span> {leaderboard[2].total_coins?.toLocaleString()}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Leaderboard List */}
            <div className="bg-[#151525] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="py-4 px-6 text-sm font-medium text-gray-400 w-20 text-center">Место</th>
                                <th className="py-4 px-6 text-sm font-medium text-gray-400">Ученик</th>
                                <th className="py-4 px-6 text-sm font-medium text-gray-400 text-right">Монеты</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-pulse">
                                        <td className="py-4 px-6"><div className="h-8 w-8 bg-white/10 rounded-full mx-auto" /></td>
                                        <td className="py-4 px-6 flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-white/10" />
                                            <div className="h-4 w-32 bg-white/10 rounded" />
                                        </td>
                                        <td className="py-4 px-6 text-right"><div className="h-5 w-16 bg-white/10 rounded ml-auto" /></td>
                                    </motion.tr>
                                ) : leaderboard.length === 0 ? (
                                    <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan="3" className="py-12 text-center text-gray-400">
                                            В этом периоде пока нет заработанных монет.
                                        </td>
                                    </motion.tr>
                                ) : (
                                    leaderboard.map((user, index) => {
                                        const isTop3 = index < 3;
                                        const isMe = user.user_id === profile?.id;
                                        return (
                                            <motion.tr 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                key={`user-${user.user_id}-${index}`} 
                                                className={`border-b border-white/5 transition-colors ${isMe ? 'bg-gaming-primary/10 hover:bg-gaming-primary/20' : 'hover:bg-white/5'}`}
                                            >
                                                <td className="py-4 px-6">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto border ${getRankStyle(index)}`}>
                                                        {getRankIcon(index)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 flex items-center justify-center ${isTop3 ? (index === 0 ? 'border-yellow-400' : index === 1 ? 'border-gray-300' : 'border-amber-600') : 'border-white/10'}`}>
                                                            <UserAvatar avatarUrl={user.avatar_url} name={user.full_name} size="md" className="w-full h-full text-base !rounded-full" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`font-medium ${isMe ? 'text-gaming-primary font-bold' : 'text-gray-200'} line-clamp-1`} title={user.full_name}>
                                                                {user.full_name} {isMe && '(Вы)'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-lg text-gaming-accent">
                                                    {user.total_coins?.toLocaleString()}
                                                </td>
                                            </motion.tr>
                                        )
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;
