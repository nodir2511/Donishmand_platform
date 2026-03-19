import {
    BookOpen, Atom, Globe, Calculator, Beaker, Leaf, ScrollText, Languages
} from 'lucide-react';

// Набор готовых аватаров (gaming-стиль)
export const AVATAR_OPTIONS = [
    { id: 'av1', emoji: '🚀', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'av2', emoji: '🐉', gradient: 'from-red-500 to-orange-500' },
    { id: 'av3', emoji: '🤖', gradient: 'from-gray-500 to-blue-400' },
    { id: 'av4', emoji: '🧙', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'av5', emoji: '🥷', gradient: 'from-gray-700 to-gray-900' },
    { id: 'av6', emoji: '⚔️', gradient: 'from-yellow-600 to-amber-700' },
    { id: 'av7', emoji: '🎮', gradient: 'from-gaming-primary to-gaming-pink' },
    { id: 'av8', emoji: '🦊', gradient: 'from-orange-400 to-red-500' },
    { id: 'av9', emoji: '🐺', gradient: 'from-slate-500 to-slate-700' },
    { id: 'av10', emoji: '🦅', gradient: 'from-amber-500 to-yellow-300' },
    { id: 'av11', emoji: '🐼', gradient: 'from-gray-100 to-gray-300' },
    { id: 'av12', emoji: '🦁', gradient: 'from-yellow-500 to-orange-600' },
    { id: 'av13', emoji: '👾', gradient: 'from-green-400 to-emerald-600' },
    { id: 'av14', emoji: '🎯', gradient: 'from-rose-500 to-pink-600' },
    { id: 'av15', emoji: '💎', gradient: 'from-cyan-400 to-blue-600' },
    { id: 'av16', emoji: '🔥', gradient: 'from-red-600 to-yellow-500' },
];


export const SUBJECT_CONFIG = {
    'tj-lang': { color: 'text-gaming-pink', bg: 'bg-gaming-pink/10', icon: BookOpen },
    'lit': { color: 'text-gaming-pink', bg: 'bg-gaming-pink/10', icon: BookOpen },
    'math': { color: 'text-gaming-primary', bg: 'bg-gaming-primary/10', icon: Calculator },
    'phys': { color: 'text-gaming-accent', bg: 'bg-gaming-accent/10', icon: Atom },
    'chem': { color: 'text-gaming-primary', bg: 'bg-gaming-primary/10', icon: Beaker },
    'bio': { color: 'text-gaming-gold', bg: 'bg-gaming-gold/10', icon: Leaf },
    'geo': { color: 'text-gaming-gold', bg: 'bg-gaming-gold/10', icon: Globe },
    'hist': { color: 'text-gaming-text', bg: 'bg-gaming-text/10', icon: ScrollText },
    'eng': { color: 'text-gaming-accent', bg: 'bg-gaming-accent/10', icon: Languages },
    'ger': { color: 'text-gaming-text', bg: 'bg-gaming-text/10', icon: Languages },
    'fra': { color: 'text-gaming-pink', bg: 'bg-gaming-pink/10', icon: Languages },
    'ara': { color: 'text-gaming-primary', bg: 'bg-gaming-primary/10', icon: Languages },
};

export const SUBJECT_NAMES = {
    'tj-lang': { ru: "Таджикский язык", tj: "Забони Тоҷикӣ" },
    'math': { ru: "Математика", tj: "Математика" },
    'phys': { ru: "Физика", tj: "Физика" },
    'chem': { ru: "Химия", tj: "Химия" },
    'geo': { ru: "География", tj: "География" },
    'hist': { ru: "История", tj: "Таърих" },
    'lit': { ru: "Литература", tj: "Адабиёт" },
    'bio': { ru: "Биология", tj: "Биология" },
    'eng': { ru: "Английский", tj: "Забони Англисӣ" },
    'ger': { ru: "Немецкий", tj: "Забони Немисӣ" },
    'fra': { ru: "Французский", tj: "Забони Франсавӣ" },
    'ara': { ru: "Арабский", tj: "Забони Арабӣ" },
};

export const CLUSTERS_STRUCTURE = [
    { id: 1, titleRu: "Естественный и тех.", titleTj: "Табиӣ ва техникӣ", subjects: ['tj-lang', 'math', 'phys', 'chem'] },
    { id: 2, titleRu: "Экономика и Гео.", titleTj: "Иқтисод ва География", subjects: ['tj-lang', 'math', 'geo', 'eng', 'fra', 'ger', 'ara'] },
    { id: 3, titleRu: "Филология и Искусство", titleTj: "Филология ва Санъат", subjects: ['tj-lang', 'hist', 'lit', 'eng', 'fra', 'ger', 'ara'] },
    { id: 4, titleRu: "Общество и Право", titleTj: "Ҷомеашиносӣ ва Ҳуқуқ", subjects: ['tj-lang', 'hist', 'eng', 'fra', 'ger', 'ara'] },
    { id: 5, titleRu: "Медицина и Биология", titleTj: "Тиб ва Биология", subjects: ['tj-lang', 'chem', 'bio', 'phys'] },
];

export const SUBJECTS_DATA = Object.entries(SUBJECT_NAMES).map(([id, names]) => ({
    id,
    nameRu: names.ru,
    nameTj: names.tj,
}));

export const ALL_SUBJECTS_LIST = Object.keys(SUBJECT_CONFIG);

export const APP_VERSION = '0.1.3';

export const CHANGELOG_HIGHLIGHTS = {
    version: '0.1.3',
    date: '19.03.2026',
    changesRu: [
        'Исправлена критическая ошибка начисления монет за тесты',
        'Усилена безопасность: RLS для оценок, проверка ролей в функциях',
        'Оптимизация загрузки: удалена тяжёлая библиотека из админки',
        'Подавление отладочных сообщений в production-режиме',
        'Исправлены косметические баги (градиенты, импорты)'
    ],
    changesTj: [
        'Хатои ҳисобкунии тангаҳо барои тестҳо ислоҳ шуд',
        'Амният мустаҳкам карда шуд: RLS барои баҳоҳо, санҷиши вазифаҳо',
        'Оптимизатсияи боркунӣ: китобхонаи вазнин аз админка хориҷ шуд',
        'Паёмҳои ислоҳотӣ дар режими production пинҳон шуданд',
        'Хатогиҳои зоҳирӣ ислоҳ шуданд (градиентҳо, импортҳо)'
    ]
};
