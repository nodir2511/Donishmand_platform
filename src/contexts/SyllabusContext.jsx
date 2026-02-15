import React, { createContext, useContext, useState, useEffect } from 'react';
import { syllabusService } from '../services/syllabusService';

// Контекст для хранения структуры предмета (разделы → темы → уроки)
const SyllabusContext = createContext(null);

// Кеш на уровне модуля — сохраняется между перемонтированиями компонентов
// Это позволяет избежать повторных запросов при навигации внутри одного предмета
const cache = {};

/**
 * Сброс кеша для указанного предмета.
 * Вызывать после сохранения данных в Supabase (например, из CreatorPage).
 * @param {string} subjectId — ID предмета для сброса кеша. Если не указан — сбрасывает весь кеш.
 */
export const invalidateSyllabusCache = (subjectId) => {
    if (subjectId) {
        delete cache[subjectId];
    } else {
        // Сброс всего кеша
        Object.keys(cache).forEach(key => delete cache[key]);
    }
};

/**
 * Провайдер для загрузки структуры предмета.
 * Стратегия: кеш → Supabase → пустая структура.
 * @param {string} subjectId — ID предмета (например, 'math', 'chem')
 */
export const SyllabusProvider = ({ subjectId, children }) => {
    // Если данные уже закешированы — используем сразу, без состояния загрузки
    const [subjectData, setSubjectData] = useState(cache[subjectId] || null);
    const [loading, setLoading] = useState(!cache[subjectId]);

    useEffect(() => {
        // Если данные уже в кеше — не нужно загружать
        if (cache[subjectId]) {
            setSubjectData(cache[subjectId]);
            setLoading(false);
            return;
        }

        const fetchStructure = async () => {
            setLoading(true);
            setSubjectData(null);
            try {
                // Загружаем из Supabase
                const data = await syllabusService.getStructure(subjectId);
                if (data) {
                    cache[subjectId] = data;
                    setSubjectData(data);
                } else {
                    // Предмет ещё не заполнен — пустая структура
                    const empty = { sections: [] };
                    cache[subjectId] = empty;
                    setSubjectData(empty);
                }
            } catch (error) {
                console.error(`Ошибка загрузки структуры предмета "${subjectId}":`, error);
                // При ошибке сети тоже показываем пустую структуру
                const empty = { sections: [] };
                cache[subjectId] = empty;
                setSubjectData(empty);
            } finally {
                setLoading(false);
            }
        };

        if (subjectId) {
            fetchStructure();
        } else {
            setLoading(false);
        }
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

