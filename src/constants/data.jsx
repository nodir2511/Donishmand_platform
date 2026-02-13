import {
    BookOpen, Atom, Globe, Calculator, Beaker, Leaf, ScrollText, Languages
} from 'lucide-react';

export const TRANSLATIONS = {
    ru: {
        heroTitle: <>Знания, которые <span className="text-gradient">меняют будущее</span></>,
        heroSubtitle: "Официальная платформа для подготовки к ИМД. Все 5 кластеров, тесты и видеоуроки в одном месте.",
        ctaStart: "Начать учиться",
        ctaCatalog: "Все предметы",
        badge: "Образование нового поколения",
        popularTitle: "Каталог предметов",
        popularSubtitle: "Выберите кластер или предмет для начала обучения",
        lessons: "уроков",
        cluster: "Кластер",
        allSubjects: "Все предметы",
        footerText: "© 2026 Donishmand Platform. Душанбе.",
        navCourses: "Курсы",
        navLibrary: "Библиотека",
        navAbout: "О нас",
        navLogin: "Войти",
        navCreator: "Создатель",
        errorTitle: "Страница не найдена",
        errorSubtitle: "Похоже, вы забрели в неизведанную зону. Страница, которую вы ищете, была удалена или перемещена.",
        errorHome: "На главную",
        errorBack: "Вернуться назад"
    },
    tj: {
        heroTitle: <>Донише, ки ояндаро <span className="text-gradient">тағйир медиҳад</span></>,
        heroSubtitle: "Платформаи расмӣ барои омодагӣ ба ММТ. Ҳамаи 5 кластер, тестҳо ва дарсҳои видеоӣ дар як ҷо.",
        ctaStart: "Оғози таълим",
        ctaCatalog: "Ҳамаи фанҳо",
        badge: "Насли нави таҳсилот",
        popularTitle: "Каталоги фанҳо",
        popularSubtitle: "Барои оғози таълим кластер ё фанро интихоб кунед",
        lessons: "дарс",
        cluster: "Кластери",
        allSubjects: "Ҳамаи фанҳо",
        footerText: "© 2026 Donishmand Platform. Душанбе.",
        navCourses: "Курсҳо",
        navLibrary: "Китобхона",
        navAbout: "Дар бораи мо",
        navLogin: "Ворид шудан",
        navCreator: "Эҷодкор",
        errorTitle: "Саҳифа ёфт нашуд",
        errorSubtitle: "Ба назар мерасад, ки шумо ба минтақаи номаълум ворид шудед. Саҳифае, ки шумо меҷӯед, ҳазф шудааст ё кӯчонида шудааст.",
        errorHome: "Ба саҳифаи асосӣ",
        errorBack: "Ба қафо"
    }
};

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
    { id: 5, titleRu: "Медицина и Биология", titleTj: "Тиб ва Биология", subjects: ['tj-lang', 'bio', 'chem', 'phys'] }
];

export const ALL_SUBJECTS_LIST = Object.keys(SUBJECT_CONFIG);
