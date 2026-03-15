import { useState, useEffect, useRef } from 'react';

/**
 * Хук для отслеживания времени обучения на странице урока.
 * Считает секунды только когда вкладка активна.
 * 
 * @param {string} lessonId - ID урока
 * @param {number} initialTime - Начальное время из БД (в секундах)
 * @param {Function} onSync - Функция для периодической синхронизации с сервером
 * @returns {number} Прошедшее время в секундах
 */
export const useEngagementTimer = (lessonId, initialTime = 0, onSync = null) => {
    const [seconds, setSeconds] = useState(initialTime);
    const secondsRef = useRef(initialTime);
    const startTimeRef = useRef(Date.now());
    const lastSyncSecondsRef = useRef(initialTime);
    
    // Обновляем состояние при изменении начального времени (после загрузки из БД)
    useEffect(() => {
        if (initialTime > secondsRef.current) {
            setSeconds(initialTime);
            secondsRef.current = initialTime;
            lastSyncSecondsRef.current = initialTime;
        }
    }, [initialTime]);

    useEffect(() => {
        if (!lessonId) return;

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                const newSeconds = secondsRef.current + 1;
                secondsRef.current = newSeconds;
                setSeconds(newSeconds);

                // Периодическая синхронизация (каждые 30 секунд накопленного времени)
                if (onSync && (newSeconds - lastSyncSecondsRef.current) >= 30) {
                    onSync(newSeconds);
                    lastSyncSecondsRef.current = newSeconds;
                }
            }
        }, 1000);

        // Синхронизация при уходе со страницы или закрытии вкладки
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && onSync) {
                onSync(secondsRef.current);
                lastSyncSecondsRef.current = secondsRef.current;
            }
        };

        const handleBeforeUnload = () => {
            if (onSync) {
                onSync(secondsRef.current);
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            
            // Финальная синхронизация при размонтировании компонента
            if (onSync && secondsRef.current !== lastSyncSecondsRef.current) {
                onSync(secondsRef.current);
            }
        };
    }, [lessonId, onSync]);

    return seconds;
};
