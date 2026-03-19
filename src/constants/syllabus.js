
/**
 * Резервные копии учебных планов (используются, если в БД пусто).
 * Перенесено из db_maintenance.js.
 */
export const SYLLABUS_FALLBACK = {
    'math': {
        sections: [
            {
                id: 'math_sec1', title: 'Алгебра', titleTj: 'Алгебра',
                topics: [{
                    id: 'math_top1', title: 'Уравнения', titleTj: 'Муодилаҳо',
                    lessons: [{ id: 'math_les1', title: 'Линейные уравнения', titleTj: 'Муодилаҳои хаттӣ', type: 'video' }]
                }]
            }
        ]
    },
    'chem': {
        sections: [
            {
                id: 'chem_sec1', title: 'Общая химия', titleTj: 'Химияи умумӣ',
                topics: [
                    {
                        id: 'chem_top1', title: 'Основные понятия химии', titleTj: 'Мафҳумҳои асосии химия',
                        lessons: [
                            { id: 'chem_les1', title: 'Атомы и молекулы', titleTj: 'Атомҳо ва молекулаҳо', type: 'video' },
                            { id: 'chem_les2', title: 'Химические элементы', titleTj: 'Элементҳои химиявӣ', type: 'text' }
                        ]
                    }
                ]
            }
        ]
    }
};
