import React from 'react';

/**
 * Базовый компонент скелетона в Gaming стиле.
 * Использует пульсирующую анимацию и полупрозрачный фон.
 */
export const Skeleton = ({ className = '', variant = 'rect' }) => {
    const baseStyles = "animate-pulse bg-white/5";
    const variantStyles = {
        rect: "rounded-xl",
        circle: "rounded-full",
        text: "rounded h-4 w-full"
    };

    return (
        <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
    );
};

/**
 * Скелетон для карточки раздела или темы
 */
export const CardSkeleton = () => (
    <div className="flex items-center gap-4 bg-gaming-card/20 border border-white/5 p-5 rounded-2xl">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
    </div>
);

/**
 * Скелетон для списка уроков
 */
export const LessonSkeleton = () => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-16 h-8 rounded-lg" />
    </div>
);

/**
 * Скелетон шапки урока
 */
export const LessonPageHeaderSkeleton = () => (
    <div className="mb-6 space-y-4">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
            </div>
        </div>
    </div>
);

/**
 * Скелетон карточки прогресса
 */
export const ProgressCardSkeleton = () => (
    <div className="bg-gaming-card/20 border border-white/5 p-6 rounded-2xl mb-8 space-y-4">
        <div className="flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/6" />
        </div>
        <div className="flex gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 flex-1" />)}
        </div>
    </div>
);

/**
 * Скелетон контента урока (Video/Text/Slides)
 */
export const LessonContentSkeleton = () => (
    <div className="space-y-6">
        <div className="flex gap-4 border-b border-white/5 pb-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-20" />)}
        </div>
        <div className="bg-gaming-card/30 border border-white/5 rounded-2xl p-6 aspect-video flex flex-col gap-4">
            <Skeleton className="flex-1 w-full" />
            <div className="h-12 flex justify-between gap-4">
                <Skeleton className="w-32 h-full" />
                <Skeleton className="w-12 h-full rounded-full" />
                <Skeleton className="w-12 h-full rounded-full" />
            </div>
        </div>
    </div>
);
