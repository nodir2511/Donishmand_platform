// Сервис перевода с использованием Google Translate API
// Использует простой словарь, если API недоступно

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

// Простой словарь RU -> TJ для основных образовательных терминов
const DICTIONARY = {
    // Общие слова
    'раздел': 'бахш',
    'тема': 'мавзӯъ',
    'урок': 'дарс',
    'тест': 'тест',
    'вопрос': 'савол',
    'ответ': 'ҷавоб',
    'правильный': 'дуруст',
    'неправильный': 'нодуруст',
    'введение': 'муқаддима',
    'заключение': 'хулоса',
    'пример': 'мисол',
    'задача': 'масъала',
    'решение': 'ҳал',
    'формула': 'формула',
    'определение': 'таъриф',
    'теорема': 'теорема',
    'доказательство': 'исбот',
    'свойство': 'хосият',
    'правило': 'қоида',
    'упражнение': 'машқ',
    'домашнее задание': 'вазифаи хонагӣ',
    'контрольная работа': 'кори назоратӣ',
    'глава': 'боб',
    'параграф': 'параграф',
    'страница': 'саҳифа',
    'рисунок': 'расм',
    'таблица': 'ҷадвал',
    'график': 'график',
    'диаграмма': 'диаграмма',
    'число': 'адад',
    'цифра': 'рақам',
    'сумма': 'ҷамъ',
    'разность': 'тафовут',
    'произведение': 'ҳосил',
    'частное': 'ҳосили тақсим',
    'дробь': 'касрс',
    'процент': 'фоиз',
    'уравнение': 'муодила',
    'неравенство': 'нобаробарӣ',
    'функция': 'функсия',
    'переменная': 'тағйирёбанда',
    'константа': 'доимӣ',
    'точка': 'нуқта',
    'линия': 'хат',
    'прямая': 'хатти рост',
    'отрезок': 'порча',
    'луч': 'нимхат',
    'угол': 'кунҷ',
    'треугольник': 'секунҷа',
    'квадрат': 'мураббаъ',
    'прямоугольник': 'росткунҷа',
    'круг': 'даврагӣ',
    'окружность': 'давра',
    'площадь': 'масоҳат',
    'периметр': 'периметр',
    'объем': 'ҳаҷм',
    'длина': 'дарозӣ',
    'ширина': 'паҳнӣ',
    'высота': 'баландӣ',
    // Предметы
    'математика': 'математика',
    'алгебра': 'алгебра',
    'геометрия': 'геометрия',
    'физика': 'физика',
    'химия': 'химия',
    'биология': 'биология',
    'история': 'таърих',
    'география': 'география',
    'литература': 'адабиёт',
    'русский язык': 'забони русӣ',
    'таджикский язык': 'забони тоҷикӣ',
    'английский язык': 'забони англисӣ',
    'информатика': 'информатика',
};

// Перевод с использованием словаря (пословно)
const translateWithDictionary = (text) => {
    if (!text) return '';

    let result = text.toLowerCase();

    // Сортировка словаря по длине ключа (сначала самые длинные) для сопоставления более длинных фраз в первую очередь
    const sortedEntries = Object.entries(DICTIONARY).sort((a, b) => b[0].length - a[0].length);

    for (const [ru, tj] of sortedEntries) {
        const regex = new RegExp(ru, 'gi');
        result = result.replace(regex, tj);
    }

    // Сделать первую букву заглавной
    return result.charAt(0).toUpperCase() + result.slice(1);
};

// Попытка использовать Google Translate API (бесплатный уровень)
const translateWithGoogle = async (text, from = 'ru', to = 'tg') => {
    try {
        const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data[0]) {
            return data[0].map(item => item[0]).join('');
        }
        throw new Error('Invalid response');
    } catch (error) {
        console.warn('Google Translate API failed, using dictionary:', error);
        return null;
    }
};

// Основная функция перевода
export const translateText = async (text, from = 'ru', to = 'tj') => {
    if (!text || !text.trim()) return '';

    // Сначала пробуем Google Translate
    const googleResult = await translateWithGoogle(text, from, to === 'tj' ? 'tg' : to);

    if (googleResult) {
        return googleResult;
    }

    // Резервный вариант — словарь
    return translateWithDictionary(text);
};

// Синхронная версия с использованием только словаря (для мгновенной обратной связи в интерфейсе)
export const translateTextSync = (text, from = 'ru', to = 'tj') => {
    if (!text || !text.trim()) return '';
    return translateWithDictionary(text);
};

export default {
    translateText,
    translateTextSync,
    DICTIONARY
};
