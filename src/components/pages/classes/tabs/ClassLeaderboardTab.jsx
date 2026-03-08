import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../services/supabase';
import { Medal, Trophy, TrendingUp, Calendar, Loader2, Coins, Users } from 'lucide-react';
import UserAvatar from '../../../common/UserAvatar';

// Иконка монеты (нет в базовом наборе lucide)
const CoinIcon = ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="10" opacity="0.2" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">₽</text>
    </svg>
);



const ClassLeaderboardTab = ({ classId }) => {
    const [period, setPeriod] = useState('day'); // 'day', 'week', 'month', 'all'
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalStudents, setTotalStudents] = useState(0);

    useEffect(() => {
        if (classId) {
            fetchLeaderboard();
        }
    }, [classId, period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // 1. Получаем ВСЕХ учеников класса вместе с профилями
            const { data: members, error: membersErr } = await supabase
                .from('class_members')
                .select(`
                    student_id,
                    profile:profiles!class_members_student_id_fkey (id, full_name, avatar_url, role)
                `)
                .eq('class_id', classId);

            if (membersErr) throw membersErr;
            if (!members || members.length === 0) {
                setLeaderboard([]);
                setTotalStudents(0);
                return;
            }

            // Оставляем только учеников (не учителей)
            const studentMembers = members.filter(
                m => !m.profile?.role || m.profile.role === 'student'
            );
            setTotalStudents(studentMembers.length);

            const studentIds = studentMembers.map(m => m.student_id);

            // 2. Строим запрос к coin_transactions
            let query = supabase
                .from('coin_transactions')
                .select('user_id, amount, created_at')
                .in('user_id', studentIds);

            // Фильтрация по времени
            if (period !== 'all') {
                const pastDate = new Date();
                if (period === 'day') {
                    pastDate.setHours(0, 0, 0, 0);
                } else if (period === 'week') {
                    pastDate.setDate(pastDate.getDate() - 7);
                } else if (period === 'month') {
                    pastDate.setMonth(pastDate.getMonth() - 1);
                }
                query = query.gte('created_at', pastDate.toISOString());
            }

            const { data: transactions, error: txErr } = await query;
            if (txErr) throw txErr;

            // 3. Агрегируем монеты по пользователям
            const userTotals = {};
            (transactions || []).forEach(tx => {
                const uid = tx.user_id;
                if (!userTotals[uid]) {
                    userTotals[uid] = { coins: 0, testsCount: 0 };
                }
                userTotals[uid].coins += tx.amount;
                userTotals[uid].testsCount += 1;
            });

            // 4. Составляем полный список (включая тех у кого 0 монет)
            const fullList = studentMembers.map(m => ({
                id: m.student_id,
                name: m.profile?.full_name || 'Неизвестный',
                avatar: m.profile?.avatar_url,
                coins: userTotals[m.student_id]?.coins || 0,
                testsCount: userTotals[m.student_id]?.testsCount || 0,
            }));

            // 5. Сортируем по убыванию монет, при равенстве — по имени
            fullList.sort((a, b) => b.coins - a.coins || a.name.localeCompare(b.name));

            setLeaderboard(fullList);
        } catch (err) {
            console.error('Ошибка загрузки лидерборда:', err);
        } finally {
            setLoading(false);
        }
    };

    // Стили медалей для топ-3
    const getMedalStyle = (index) => {
        if (index === 0) return {
            badge: 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300',
            row: 'bg-yellow-400/5 border-yellow-400/20',
            glow: 'shadow-[0_0_20px_rgba(250,204,21,0.15)]'
        };
        if (index === 1) return {
            badge: 'bg-slate-400/15 border-slate-400/40 text-slate-300',
            row: 'bg-slate-400/5 border-slate-400/20',
            glow: ''
        };
        if (index === 2) return {
            badge: 'bg-amber-600/15 border-amber-600/40 text-amber-500',
            row: 'bg-amber-600/5 border-amber-600/20',
            glow: ''
        };
        return {
            badge: 'bg-white/5 border-white/10 text-gaming-textMuted',
            row: 'bg-transparent border-white/5 hover:bg-white/[0.02]',
            glow: ''
        };
    };

    // Значок для топ-3
    const getRankBadge = (index) => {
        if (index === 0) return <Trophy size={18} className="text-yellow-400" />;
        if (index === 1) return <Medal size={18} className="text-slate-300" />;
        if (index === 2) return <Medal size={18} className="text-amber-500" />;
        return <span className="font-bold text-sm">{index + 1}</span>;
    };

    // Количество монет заработанных за период (только те у кого > 0)
    const activeStudents = leaderboard.filter(s => s.coins > 0).length;
    const totalCoins = leaderboard.reduce((sum, s) => sum + s.coins, 0);

    return (
        <div className="animate-fade-in-up space-y-6">
            {/* Заголовок и фильтры */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                    <Trophy size={24} className="text-gaming-gold" />
                    Топ класса по монетам
                </h2>

                {/* Фильтры периода */}
                <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 w-fit">
                    {[
                        { id: 'day', label: 'Сегодня' },
                        { id: 'week', label: 'Неделя' },
                        { id: 'month', label: 'Месяц' },
                        { id: 'all', label: 'Всё время' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPeriod(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === tab.id
                                ? 'bg-gaming-gold/20 text-gaming-gold shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Сводные карточки */}
            {!loading && leaderboard.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gaming-card/40 border border-white/10 rounded-2xl p-4 text-center">
                        <Users size={20} className="mx-auto mb-1 text-gaming-textMuted" />
                        <div className="text-2xl font-bold text-white">{totalStudents}</div>
                        <div className="text-xs text-gaming-textMuted">Учеников</div>
                    </div>
                    <div className="bg-gaming-card/40 border border-white/10 rounded-2xl p-4 text-center">
                        <Trophy size={20} className="mx-auto mb-1 text-gaming-gold" />
                        <div className="text-2xl font-bold text-gaming-gold">{totalCoins}</div>
                        <div className="text-xs text-gaming-textMuted">Монет всего</div>
                    </div>
                    <div className="bg-gaming-card/40 border border-white/10 rounded-2xl p-4 text-center">
                        <TrendingUp size={20} className="mx-auto mb-1 text-gaming-accent" />
                        <div className="text-2xl font-bold text-gaming-accent">{activeStudents}</div>
                        <div className="text-xs text-gaming-textMuted">Активных</div>
                    </div>
                </div>
            )}

            {/* Таблица лидеров */}
            <div className="bg-gaming-card/40 border border-white/10 rounded-3xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="animate-spin text-gaming-gold" size={32} />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Trophy size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-300 mb-1">Пока нет учеников</h3>
                        <p className="text-gaming-textMuted text-sm">
                            Добавьте учеников в класс, и здесь появится лидерборд.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Шапка таблицы */}
                        <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-6 py-3 border-b border-white/10 bg-white/5">
                            <div className="text-xs font-medium text-gaming-textMuted uppercase tracking-wider text-center">#</div>
                            <div className="text-xs font-medium text-gaming-textMuted uppercase tracking-wider">Ученик</div>
                            <div className="text-xs font-medium text-gaming-textMuted uppercase tracking-wider text-center">Тестов</div>
                            <div className="text-xs font-medium text-gaming-textMuted uppercase tracking-wider text-right">Монеты</div>
                        </div>

                        {/* Список */}
                        <div className="divide-y divide-white/5">
                            {leaderboard.map((student, index) => {
                                const style = getMedalStyle(index);
                                return (
                                    <div
                                        key={student.id}
                                        className={`grid grid-cols-[3rem_1fr_auto_auto] gap-4 items-center px-6 py-4 border-l-2 transition-all ${student.coins > 0 ? style.row : 'bg-transparent border-transparent hover:bg-white/[0.02]'} ${style.glow}`}
                                    >
                                        {/* Ранг */}
                                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mx-auto ${style.badge}`}>
                                            {getRankBadge(index)}
                                        </div>

                                        {/* Имя + аватар */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <UserAvatar avatarUrl={student.avatar} name={student.name} size="sm" />
                                            <span className={`font-medium truncate ${student.coins > 0 ? 'text-white' : 'text-gaming-textMuted'}`}>
                                                {student.name}
                                            </span>
                                        </div>

                                        {/* Количество тестов */}
                                        <div className="text-center">
                                            <span className="text-sm text-gaming-textMuted">
                                                {student.testsCount > 0 ? student.testsCount : '—'}
                                            </span>
                                        </div>

                                        {/* Монеты */}
                                        <div className="flex items-center justify-end gap-2">
                                            {student.coins > 0 ? (
                                                <div className="flex items-center gap-1.5 bg-gaming-gold/10 border border-gaming-gold/30 px-3 py-1.5 rounded-xl">
                                                    <span className="text-gaming-gold text-lg">🪙</span>
                                                    <span className="font-bold text-gaming-gold">{student.coins}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gaming-textMuted text-sm px-3">0</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Подсказка */}
            <p className="text-xs text-gaming-textMuted text-center">
                🪙 Монеты начисляются за успешную сдачу тестов (≥80%)
            </p>
        </div>
    );
};

export default ClassLeaderboardTab;
