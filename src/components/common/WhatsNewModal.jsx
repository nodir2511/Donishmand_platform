import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, CHANGELOG_HIGHLIGHTS } from '../../constants/data';

const WhatsNewModal = () => {
    const { i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'tj';

    useEffect(() => {
        const lastSeenVersion = localStorage.getItem('last_seen_version');
        if (lastSeenVersion !== APP_VERSION) {
            // Небольшая задержка перед показом для лучшего UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('last_seen_version', APP_VERSION);
        setIsVisible(false);
    };

    const highlights = currentLang === 'ru' ? CHANGELOG_HIGHLIGHTS.changesRu : CHANGELOG_HIGHLIGHTS.changesTj;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-gaming-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header Image/Glow */}
                        <div className="h-32 bg-gradient-to-br from-gaming-primary/30 to-gaming-pink/30 relative flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-64 h-64 bg-gaming-primary/20 blur-3xl rounded-full"
                            />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg mb-2">
                                    <Sparkles className="text-gaming-accent w-8 h-8 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
                                    {currentLang === 'ru' ? 'Что нового?' : 'Чӣ навигарӣ?'}
                                </h2>
                                <span className="text-xs font-bold text-gaming-accent uppercase tracking-[0.2em] bg-gaming-accent/10 px-3 py-1 rounded-full border border-gaming-accent/20 mt-1">
                                    Version {APP_VERSION}
                                </span>
                            </div>

                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Changes List */}
                        <div className="p-8">
                            <div className="space-y-4">
                                {highlights.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + index * 0.1 }}
                                        className="flex gap-4 items-start group"
                                    >
                                        <div className="mt-1 w-5 h-5 rounded-full bg-gaming-primary/20 flex items-center justify-center shrink-0 border border-gaming-primary/30 group-hover:bg-gaming-primary/40 transition-colors">
                                            <CheckCircle2 className="text-gaming-primary w-3 h-3" />
                                        </div>
                                        <p className="text-gaming-textMuted group-hover:text-white transition-colors leading-relaxed">
                                            {item}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleClose}
                                className="w-full mt-10 py-4 bg-gradient-to-r from-gaming-primary to-gaming-purple text-white font-bold rounded-2xl shadow-lg shadow-gaming-primary/25 hover:shadow-gaming-primary/40 transition-all flex items-center justify-center gap-2 group"
                            >
                                {currentLang === 'ru' ? 'Понятно' : 'Фаҳмо'}
                                <CheckCircle2 size={18} className="group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>

                        {/* Decorative background element */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gaming-pink/10 blur-3xl rounded-full" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WhatsNewModal;
