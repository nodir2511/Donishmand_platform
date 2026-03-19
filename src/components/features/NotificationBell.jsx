import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'tj';

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            // Можно добавить интервал для проверки новых уведомлений
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'test_checked': return <Check className="text-green-400" size={16} />;
            case 'new_lesson': return <ExternalLink className="text-gaming-accent" size={16} />;
            case 'achievement': return <Bell className="text-gaming-gold" size={16} />;
            default: return <Info className="text-gaming-primary" size={16} />;
        }
    };

    const getTimeAgo = (date) => {
        try {
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            
            let interval = seconds / 31536000;
            if (interval > 1) {
                const val = Math.floor(interval);
                return currentLang === 'ru' ? `${val} лет назад` : `${val} сол пеш`;
            }
            interval = seconds / 2592000;
            if (interval > 1) {
                const val = Math.floor(interval);
                return currentLang === 'ru' ? `${val} мес. назад` : `${val} моҳ пеш`;
            }
            interval = seconds / 86400;
            if (interval > 1) {
                const val = Math.floor(interval);
                return currentLang === 'ru' ? `${val} дн. назад` : `${val} рӯз пеш`;
            }
            interval = seconds / 3600;
            if (interval > 1) {
                const val = Math.floor(interval);
                return currentLang === 'ru' ? `${val} ч. назад` : `${val} соат пеш`;
            }
            interval = seconds / 60;
            if (interval > 1) {
                const val = Math.floor(interval);
                return currentLang === 'ru' ? `${val} мин. назад` : `${val} дақиқа пеш`;
            }
            
            return currentLang === 'ru' ? 'Только что' : 'Ҳозир';
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className={`relative p-2 rounded-full transition-all duration-300 ${
                    isOpen ? 'bg-gaming-primary/20 text-gaming-primary' : 'bg-white/5 text-gaming-textMuted hover:bg-white/10 hover:text-white'
                }`}
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-pulse' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-gaming-bg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-gaming-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Bell size={16} className="text-gaming-primary" />
                                {currentLang === 'ru' ? 'Уведомления' : 'Огоҳиномаҳо'}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] uppercase tracking-wider text-gaming-primary hover:text-white transition-colors"
                                >
                                    {currentLang === 'ru' ? 'Прочитать все' : 'Ҳамаро хондан'}
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {loading && notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-gaming-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-gaming-textMuted">{t('loading')}</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => !n.is_read && markAsRead(n.id)}
                                            className={`p-4 flex gap-3 hover:bg-white/5 transition-colors cursor-pointer group ${!n.is_read ? 'bg-gaming-primary/5' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                                                !n.is_read ? 'bg-gaming-primary/20' : 'bg-white/5 grayscale opacity-70'
                                            }`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className={`text-sm font-bold truncate ${!n.is_read ? 'text-white' : 'text-gaming-textMuted'}`}>
                                                        {currentLang === 'ru' ? n.title_ru : n.title_tj}
                                                    </h4>
                                                    {!n.is_read && (
                                                        <div className="w-2 h-2 bg-gaming-primary rounded-full shadow-[0_0_8px_rgba(108,93,211,0.8)]" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gaming-textMuted line-clamp-2 leading-relaxed mb-2">
                                                    {currentLang === 'ru' ? n.message_ru : n.message_tj}
                                                </p>
                                                <span className="text-[10px] text-gaming-textMuted/60 flex items-center gap-1 uppercase tracking-tighter">
                                                    {getTimeAgo(n.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell size={32} className="text-white/10" />
                                    </div>
                                    <p className="text-sm font-bold text-white/40">
                                        {currentLang === 'ru' ? 'Уведомлений пока нет' : 'Огоҳиномаҳо вуҷуд надоранд'}
                                    </p>
                                    <p className="text-xs text-gaming-textMuted/40 mt-1">
                                        {currentLang === 'ru' ? 'Здесь будут появляться новости' : 'Хабарҳо дар ин ҷо пайдо мешаванд'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/5 bg-white/5 text-center">
                            <span className="text-[10px] text-gaming-textMuted/40 uppercase tracking-widest">
                                Donishmand Platform v0.1.1
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
