import React from 'react';
import { AVATAR_OPTIONS } from '../../constants/data';

const UserAvatar = ({ avatarUrl, name, size = 'md', className = '' }) => {
    const currentAvatar = AVATAR_OPTIONS.find(a => a.id === avatarUrl);
    const initials = name ? name.charAt(0).toUpperCase() : '?';

    // Базовые стили для разных размеров
    const sizeClasses = {
        sm: 'w-9 h-9 text-lg rounded-full',
        md: 'w-10 h-10 text-xl rounded-full',
        lg: 'w-16 h-16 text-3xl rounded-2xl',
        xl: 'w-24 h-24 text-4xl rounded-3xl' // как в StudentDashboard
    };

    const SizingClass = sizeClasses[size] || sizeClasses.md;

    if (currentAvatar) {
        return (
            <div className={`${SizingClass} bg-gradient-to-br ${currentAvatar.gradient} flex items-center justify-center shadow-inner shrink-0 leading-none select-none ${className}`}>
                {currentAvatar.emoji}
            </div>
        );
    }

    // Если нет аватара в AVATAR_OPTIONS (fallback на базу)
    return (
        <div className={`${SizingClass} bg-gaming-card border border-white/10 text-gaming-textMuted flex items-center justify-center font-bold shrink-0 leading-none select-none ${className}`}>
            {initials}
        </div>
    );
};

export default UserAvatar;
