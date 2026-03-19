import React, { useState, useEffect } from 'react';
import { notificationService, branchService, classService } from '../../services/apiService';
import { 
    Bell, 
    Megaphone, 
    Send, 
    Users, 
    Building, 
    School, 
    Loader2, 
    AlertCircle, 
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminNotificationsTab = () => {
    // Состояние формы
    const [mode, setMode] = useState('notification'); // 'notification' | 'announcement'
    const [target, setTarget] = useState('all'); // 'all' | 'branch' | 'class'
    const [targetId, setTargetId] = useState('');
    const [targetVal, setTargetVal] = useState(''); // Для названия филиала
    
    const [titleRu, setTitleRu] = useState('');
    const [titleTj, setTitleTj] = useState('');
    const [messageRu, setMessageRu] = useState('');
    const [messageTj, setMessageTj] = useState('');
    const [type, setType] = useState('admin');
    const [expiresAt, setExpiresAt] = useState('');
    
    // Списки для выбора
    const [branches, setBranches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    
    // Состояние отправки
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState({ type: null, message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [branchesData, classesData] = await Promise.all([
                branchService.getBranches(),
                classService.getAllClasses()
            ]);
            setBranches(branchesData);
            setClasses(classesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        setStatus({ type: null, message: '' });

        try {
            if (mode === 'notification') {
                await notificationService.sendMassNotification({
                    targets: target,
                    targetId: target === 'class' ? targetId : null,
                    targetVal: target === 'branch' ? targetVal : null,
                    type,
                    titleRu,
                    titleTj,
                    messageRu,
                    messageTj
                });
                setStatus({ type: 'success', message: 'Уведомления успешно отправлены!' });
            } else {
                await notificationService.createAnnouncement({
                    type: target,
                    target_id: target === 'class' ? targetId : null,
                    title_ru: titleRu,
                    title_tj: titleTj,
                    content_ru: messageRu,
                    content_tj: messageTj,
                    expires_at: expiresAt || null
                });
                setStatus({ type: 'success', message: 'Анонс успешно создан!' });
            }

            // Сброс формы (кроме режима и таргета для удобства)
            setTitleRu('');
            setTitleTj('');
            setMessageRu('');
            setMessageTj('');
            setExpiresAt('');
            
        } catch (error) {
            console.error('Error sending:', error);
            setStatus({ type: 'error', message: error.message || 'Произошла ошибка при отправке' });
        } finally {
            setSending(false);
        }
    };

    const isFormValid = titleRu && titleTj && messageRu && messageTj && (target === 'all' || (target === 'branch' ? targetVal : targetId));

    return (
        <div className="animate-fade-in max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Левая колонка: Настройки типа и цели */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-gaming-card border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                        <h3 className="text-white font-heading font-bold mb-4 flex items-center gap-2">
                            1. Тип сообщения
                        </h3>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setMode('notification')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                    mode === 'notification' 
                                    ? 'bg-gaming-primary/20 border-gaming-primary text-white shadow-lg shadow-gaming-primary/10' 
                                    : 'bg-black/20 border-white/5 text-gaming-textMuted hover:border-white/20'
                                }`}
                            >
                                <Bell size={20} />
                                <div className="text-left">
                                    <div className="font-bold">Уведомление</div>
                                    <div className="text-xs opacity-70">Придет в колокольчик</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setMode('announcement')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                    mode === 'announcement' 
                                    ? 'bg-gaming-accent/20 border-gaming-accent text-white shadow-lg shadow-gaming-accent/10' 
                                    : 'bg-black/20 border-white/5 text-gaming-textMuted hover:border-white/20'
                                }`}
                            >
                                <Megaphone size={20} />
                                <div className="text-left">
                                    <div className="font-bold">Анонс</div>
                                    <div className="text-xs opacity-70">Баннер вверху сайта</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-gaming-card border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                        <h3 className="text-white font-heading font-bold mb-4 flex items-center gap-2">
                            2. Кому отправить
                        </h3>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'Всем', icon: <Users size={14} /> },
                                    { id: 'branch', label: 'Филиал', icon: <Building size={14} /> },
                                    { id: 'class', label: 'Группа', icon: <School size={14} /> }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTarget(t.id)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all border ${
                                            target === t.id 
                                            ? 'bg-white/10 border-white/20 text-white' 
                                            : 'bg-black/20 border-white/5 text-gaming-textMuted'
                                        }`}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>

                            {target === 'branch' && (
                                <select
                                    value={targetVal}
                                    onChange={(e) => setTargetVal(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gaming-primary"
                                >
                                    <option value="">Выберите филиал...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            )}

                            {target === 'class' && (
                                <select
                                    value={targetId}
                                    onChange={(e) => setTargetId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gaming-primary"
                                >
                                    <option value="">Выберите группу...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.branch?.name || 'Без филиала'})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {mode === 'notification' && (
                        <div className="bg-gaming-card border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                            <h3 className="text-white font-heading font-bold mb-4">
                                3. Иконка / Категория
                            </h3>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gaming-primary"
                            >
                                <option value="admin">Администрация</option>
                                <option value="system">Система</option>
                                <option value="achievement">Достижение</option>
                                <option value="test_checked">Оценка</option>
                                <option value="new_lesson">Новый контент</option>
                            </select>
                        </div>
                    )}

                    {mode === 'announcement' && (
                        <div className="bg-gaming-card border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                            <h3 className="text-white font-heading font-bold mb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-pink-500" />
                                Срок действия
                            </h3>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500 [color-scheme:dark]"
                            />
                            <p className="text-[10px] text-gaming-textMuted mt-2">
                                После этой даты анонс исчезнет. Если пусто — анонс висит вечно.
                            </p>
                        </div>
                    )}
                </div>

                {/* Правая колонка: Текст сообщения (RU/TJ) */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSend} className="bg-gaming-card border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <div className="space-y-6">
                            {/* Русский язык */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase font-bold">RU</span>
                                    <h4 className="text-white font-medium">Версия на русском</h4>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Заголовок уведомления"
                                    value={titleRu}
                                    onChange={(e) => setTitleRu(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gaming-primary"
                                />
                                <textarea
                                    placeholder="Текст сообщения..."
                                    rows={3}
                                    value={messageRu}
                                    onChange={(e) => setMessageRu(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gaming-primary resize-none"
                                />
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* Таджикский язык */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-bold">TJ</span>
                                    <h4 className="text-white font-medium">Нусхаи тоҷикӣ</h4>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Сарлавҳаи огоҳинома"
                                    value={titleTj}
                                    onChange={(e) => setTitleTj(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gaming-primary"
                                />
                                <textarea
                                    placeholder="Матни огоҳинома..."
                                    rows={3}
                                    value={messageTj}
                                    onChange={(e) => setMessageTj(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gaming-primary resize-none"
                                />
                            </div>

                            {/* Статус */}
                            <AnimatePresence>
                                {status.message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`flex items-center gap-2 p-3 rounded-xl ${
                                            status.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}
                                    >
                                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        <span className="text-sm font-medium">{status.message}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Кнопка отправки */}
                            <button
                                type="submit"
                                disabled={sending || !isFormValid}
                                className="w-full py-4 bg-gradient-to-r from-gaming-primary via- gaming-accent to-pink-500 text-white rounded-xl font-bold shadow-xl shadow-gaming-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 mt-4"
                            >
                                {sending ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Send size={20} className="rotate-45" />
                                        ОТПРАВИТЬ {mode === 'notification' ? 'УВЕДОМЛЕНИЯ' : 'АНОНС'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationsTab;
