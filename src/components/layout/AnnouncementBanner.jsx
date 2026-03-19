import React, { useState, useEffect } from 'react';
import { Megaphone, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const AnnouncementBanner = () => {
    const { i18n } = useTranslation();
    const { user, profile } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'tj';

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getAnnouncements();
            // Фильтрация по таргету (в идеале на бэкенде, но здесь для надежности)
            const filtered = data.filter(a => {
                if (a.type === 'global') return true;
                // Дополнительная логика для классов/филиалов может быть добавлена здесь
                return false;
            });
            setAnnouncements(filtered);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        // Скрываем на текущую сессию
        sessionStorage.setItem('announcements_dismissed', 'true');
    };

    useEffect(() => {
        if (sessionStorage.getItem('announcements_dismissed')) {
            setDismissed(true);
        }
    }, []);

    if (dismissed || announcements.length === 0 || loading) return null;

    const current = announcements[currentIndex];

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-40 bg-gradient-to-r from-gaming-primary/20 via-gaming-purple/20 to-gaming-primary/20 border-b border-white/10 backdrop-blur-md overflow-hidden"
        >
            {/* Animated Background Line */}
            <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-[1px] w-1/3 bg-gradient-to-r from-transparent via-gaming-accent to-transparent"
            />

            <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-gaming-primary/20 flex items-center justify-center shrink-0 border border-gaming-primary/30">
                            <Megaphone size={16} className="text-gaming-primary animate-float" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-white truncate">
                                <span className="font-bold text-gaming-accent mr-2">
                                    {currentLang === 'ru' ? current.title_ru : current.title_tj}:
                                </span>
                                {currentLang === 'ru' ? current.content_ru : current.content_tj}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {announcements.length > 1 && (
                            <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/5 mr-2">
                                <button 
                                    onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
                                    className="p-1 hover:text-gaming-accent transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="text-[10px] font-bold w-6 text-center">
                                    {currentIndex + 1}/{announcements.length}
                                </span>
                                <button 
                                    onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                                    className="p-1 hover:text-gaming-accent transition-colors"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                        
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            title={currentLang === 'ru' ? 'Закрыть' : 'Пӯшидан'}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AnnouncementBanner;
