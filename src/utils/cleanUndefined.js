/**
 * Рекурсивно удаляет ключи со значением undefined из объектов и массивов.
 * Необходимо применять перед отправкой данных в Supabase, так как API
 * возвращает ошибку 406 Not Acceptable при наличии undefined значений в JSON.
 * @param {*} obj
 * @returns {*} Очищенный объект/массив
 */
export const cleanUndefined = (obj) => {
    if (Array.isArray(obj)) return obj.map(cleanUndefined);
    if (obj instanceof Date) return obj; // Не ломаем даты
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, cleanUndefined(v)])
        );
    }
    return obj;
};
