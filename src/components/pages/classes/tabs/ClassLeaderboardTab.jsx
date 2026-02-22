import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../services/supabase';
import { Medal, Trophy, TrendingUp, Calendar, Loader2 } from 'lucide-react';

const ClassLeaderboardTab = ({ classId }) => {
    const [period, setPeriod] = useState('day'); // 'day', 'week', 'month', 'all'
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (classId) {
            fetchLeaderboard();
        }
    }, [classId, period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // 1. Получаем список ID учеников в этом классе
            const { data: members, error: membersErr } = await supabase
                .from('class_members')
                .select('student_id')
                .eq('class_id', classId);

            if (membersErr) throw membersErr;
            if (!members || members.length === 0) {
                setLeaderboard([]);
                return;
            }

            const studentIds = members.map(m => m.student_id);

            // 2. Строим запрос к coin_transactions
            let query = supabase
                .from('coin_transactions')
                .select('user_id, amount, profiles!inner(full_name)')
                .in('user_id', studentIds);

            // Фильтрация по времени
            if (period !== 'all') {
                const now = new Date();
                let pastDate = new Date();

                if (period === 'day') {
                    pastDate.setHours(0, 0, 0, 0);
                } else if (period === 'week') {
                    pastDate.setDate(now.getDate() - 7);
                } else if (period === 'month') {
                    pastDate.setMonth(now.getMonth() - 1);
                }

                query = query.gte('created_at', pastDate.toISOString());
            }

            const { data: transactions, error: txErr } = await query;
            if (txErr) throw txErr;

            // 3. Агрегируем монеты по пользователям
            const userTotals = {};
            transactions?.forEach(tx => {
                const uid = tx.user_id;
                if (!userTotals[uid]) {
                    userTotals[uid] = {
                        id: uid,
                        name: tx.profiles?.full_name || 'Неизвестный',
                        coins: 0
                    };
                }
                userTotals[uid].coins += tx.amount;
            });

            // 4. Сортируем по убыванию монет
            const sorted = Object.values(userTotals)
                .sort((a, b) => b.coins - a.coins)
                .slice(0, 10); // Показываем топ 10

            setLeaderboard(sorted);
        } catch (err) {
            console.error('Ошибка загрузки лидерборда:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMedalColor = (index) => {
        if (index === 0) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        if (index === 1) return 'text-slate-300 bg-slate-300/10 border-slate-300/20';
        if (index === 2) return 'text-amber-600 bg-amber-600/10 border-amber-600/20';
        return 'text-gaming-textMuted bg-white/5 border-white/5';
    };

    return (
        <div className="animate-fade-in-up">
            {/* Панель фильтров */}
            <div className="flex flex-col gap-4 mb-6">
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                    <Trophy size={24} className="text-gaming-accent" /> Топ класса
                </h2>

                <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 w-fit">
                    {[
                        { id: 'day', label: 'День' },
                        { id: 'week', label: 'Неделя' },
                        { id: 'month', label: 'Месяц' },
                        { id: 'all', label: 'Всё время' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPeriod(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === tab.id
                                ? 'bg-gaming-accent/20 text-gaming-accent shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Список лидеров */}
            <div className="bg-gaming-card/40 border border-white/10 rounded-3xl p-6 md:p-8">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="animate-spin text-gaming-accent" size={32} />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Trophy size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-300 mb-1">Пока нет данных</h3>
                        <p className="text-gaming-textMuted text-sm">
                            Никто из учеников еще не заработал монет за выбранный период.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leaderboard.map((student, index) => (
                            <div
                                key={student.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${index < 3 ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex justify-center items-center font-bold text-lg border ${getMedalColor(index)}`}>
                                        {index === 0 ? <Trophy size={20} /> : index + 1}
                                    </div>
                                    <div className="font-medium text-white text-lg">
                                        {student.name}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-gaming-accent/10 px-4 py-2 rounded-xl border border-gaming-accent/20">
                                    <span className="text-gaming-accent font-bold text-lg">{student.coins}</span>
                                    <span className="text-gaming-accent/70 text-sm font-medium">монет</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassLeaderboardTab;
