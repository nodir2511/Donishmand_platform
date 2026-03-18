import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * Расчет уровня на основе XP (X15 баланс)
 * XP = 750 * L * (L - 1)
 */
export const calculateLevelInfo = (totalXp) => {
    if (!totalXp || totalXp < 0) totalXp = 0;
    
    // Обратная формула: L = (1 + sqrt(1 + 8 * XP / 750)) / 2
    const level = Math.floor((1 + Math.sqrt(1 + 8 * totalXp / 750)) / 2) || 1;
    
    const currentLevelXp = 750 * level * (level - 1);
    const nextLevelXp = 750 * (level + 1) * level;
    
    const progressInLevel = totalXp - currentLevelXp;
    const totalInLevel = nextLevelXp - currentLevelXp;
    const percentage = Math.min(Math.round((progressInLevel / totalInLevel) * 100), 100);

    return {
        level,
        xpInLevel: progressInLevel,
        nextLevelRequired: totalInLevel,
        percentage
    };
};

const LevelProgressBar = ({ xp = 0, className = "" }) => {
    const { t } = useTranslation();
    const { level, xpInLevel, nextLevelRequired, percentage } = calculateLevelInfo(xp);

    return (
        <div className={`p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className="text-secondary-accent text-xs font-bold uppercase tracking-wider opacity-70">
                        {t('studentDashboard.level')}
                    </span>
                    <h3 className="text-3xl font-heading font-bold text-white leading-none">
                        {level}
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-white/60 text-xs font-medium">
                        {xpInLevel.toLocaleString()} / {nextLevelRequired.toLocaleString()} XP
                    </span>
                </div>
            </div>

            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-gaming-primary via-gaming-accent to-gaming-cyan shadow-gaming-primary/20 shadow-lg"
                />
            </div>
            
            {percentage > 90 && (
                <p className="text-[10px] text-gaming-accent mt-1 animate-pulse">
                    Почти новый уровень! 🔥
                </p>
            )}
        </div>
    );
};

export default LevelProgressBar;
