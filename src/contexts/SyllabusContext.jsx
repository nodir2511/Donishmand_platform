import React, { createContext, useContext, useState, useEffect } from 'react';
import { syllabusService } from '../services/syllabusService';

// Контекст для хранения структуры предмета (разделы → темы → уроки)
const SyllabusContext = createContext(null);

// Экспорт функции инвалидации кэша из сервиса для обратной совместимости
export const invalidateSyllabusCache = (subjectId) => {
    syllabusService.invalidateCache(subjectId);
};

/**
 * Провайдер для загрузки структуры предмета.
 * Стратегия: кеш (внутри сервиса) → Supabase → пустая структура.
 * @param {string} subjectId — ID предмета (например, 'math', 'chem')
 */
export const SyllabusProvider = ({ subjectId, children }) => {
    const [subjectData, setSubjectData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchStructure = async () => {
            setLoading(true);
            try {
                // Сервис теперь сам управляет кешированием
                const data = await syllabusService.getStructure(subjectId);
                if (mounted) {
                    setSubjectData(data || { sections: [] });
                }
            } catch (error) {
                console.error(`Ошибка загрузки структуры предмета "${subjectId}":`, error);
                if (mounted) {
                    setSubjectData({ sections: [] });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (subjectId) {
            fetchStructure();
        } else {
            setLoading(false);
        }

        return () => { mounted = false; };
    }, [subjectId]);

    return (
        <SyllabusContext.Provider value={{ subjectData, loading, subjectId }}>
            {children}
        </SyllabusContext.Provider>
    );
};

/**
 * Хук для доступа к данным структуры предмета.
 * @returns {{ subjectData: object|null, loading: boolean, subjectId: string }}
 */
export const useSyllabus = () => {
    const context = useContext(SyllabusContext);
    if (context === null) {
        throw new Error('useSyllabus должен использоваться внутри SyllabusProvider');
    }
    return context;
};

