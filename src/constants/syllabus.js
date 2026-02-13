export const MOCK_SYLLABUS = {
    'tj-lang': {
        sections: [
            {
                id: 'sec1',
                title: 'Морфология',
                topics: [
                    {
                        id: 'top1',
                        title: 'Имя существительное',
                        lessons: [
                            { id: 'les1', title: 'Род и число существительных', type: 'video' },
                            { id: 'les2', title: 'Падежи', type: 'text' }
                        ]
                    },
                    {
                        id: 'top2',
                        title: 'Глагол',
                        lessons: [
                            { id: 'les3', title: 'Времена глагола', type: 'video' }
                        ]
                    }
                ]
            },
            {
                id: 'sec2',
                title: 'Синтаксис',
                topics: [
                    {
                        id: 'top3',
                        title: 'Предложение',
                        lessons: [
                            { id: 'les4', title: 'Виды предложений', type: 'text' }
                        ]
                    }
                ]
            }
        ]
    },
    // Добавьте другие предметы по мере необходимости с аналогичной структурой
    'math': {
        sections: [
            {
                id: 'math_sec1',
                title: 'Алгебра',
                topics: [
                    {
                        id: 'math_top1',
                        title: 'Уравнения',
                        lessons: [
                            { id: 'math_les1', title: 'Линейные уравнения', type: 'video' }
                        ]
                    }
                ]
            }
        ]
    },
    'chem': {
        sections: [
            {
                id: 'chem_sec1',
                title: 'Общая химия',
                titleTj: 'Химияи умумӣ',
                topics: [
                    {
                        id: 'chem_top1',
                        title: 'Основные понятия химии',
                        titleTj: 'Мафҳумҳои асосии химия',
                        lessons: [
                            { id: 'chem_les1', title: 'Атомы и молекулы', titleTj: 'Атомҳо ва молекулаҳо', type: 'video' },
                            { id: 'chem_les2', title: 'Химические элементы', titleTj: 'Элементҳои химиявӣ', type: 'text' }
                        ]
                    },
                    {
                        id: 'chem_top2',
                        title: 'Строение атома',
                        titleTj: 'Сохтори атом',
                        lessons: [
                            { id: 'chem_les3', title: 'Ядро и электроны', titleTj: 'Ядро ва электронҳо', type: 'video' },
                            { id: 'chem_les4', title: 'Периодический закон', titleTj: 'Қонуни даврӣ', type: 'text' }
                        ]
                    }
                ]
            },
            {
                id: 'chem_sec2',
                title: 'Неорганическая химия',
                titleTj: 'Химияи ғайриорганикӣ',
                topics: [
                    {
                        id: 'chem_top3',
                        title: 'Основные классы соединений',
                        titleTj: 'Синфҳои асосии пайвастагиҳо',
                        lessons: [
                            { id: 'chem_les5', title: 'Оксиды и основания', titleTj: 'Оксидҳо ва асосҳо', type: 'video' },
                            { id: 'chem_les6', title: 'Кислоты и соли', titleTj: 'Кислотаҳо ва намакҳо', type: 'text' }
                        ]
                    },
                    {
                        id: 'chem_top4',
                        title: 'Металлы и неметаллы',
                        titleTj: 'Металлҳо ва ғайриметаллҳо',
                        lessons: [
                            { id: 'chem_les7', title: 'Свойства металлов', titleTj: 'Хосиятҳои металлҳо', type: 'video' }
                        ]
                    }
                ]
            },
            {
                id: 'chem_sec3',
                title: 'Органическая химия',
                titleTj: 'Химияи органикӣ',
                topics: [
                    {
                        id: 'chem_top5',
                        title: 'Введение в органику',
                        titleTj: 'Муқаддима ба органика',
                        lessons: [
                            { id: 'chem_les8', title: 'Углеводороды', titleTj: 'Карбогидридҳо', type: 'video' },
                            { id: 'chem_les9', title: 'Спирты и кислоты', titleTj: 'Спиртҳо ва кислотаҳо', type: 'text' }
                        ]
                    }
                ]
            }
        ]
    }
};
