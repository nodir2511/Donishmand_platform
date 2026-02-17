import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Скрываем маркетинговое сообщение i18next (перенесено в console-overrides.js)

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'ru',
        debug: false, // Можно отключить в продакшене

        interpolation: {
            escapeValue: false, // React сам экранирует XSS
        },

        backend: {
            loadPath: import.meta.env.BASE_URL + 'locales/{{lng}}/translation.json?v=' + new Date().getTime(),
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },

        react: {
            useSuspense: false
        }
    });

export default i18n;
