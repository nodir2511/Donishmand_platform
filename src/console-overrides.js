// Подавление консольного вывода в production
// В dev-режиме — фильтрация шума от i18next и React DevTools
// В production — полное подавление console.log/warn/error (безопасность)

if (import.meta.env.DEV) {
    // В dev-режиме оставляем все сообщения, кроме спама
    const originalInfo = console.info;
    const originalLog = console.log;

    console.info = (...args) => {
        if (typeof args[0] === 'string') {
            if (args[0].includes('i18next is maintained')) return;
            if (args[0].includes('Download the React DevTools')) return;
        }
        originalInfo(...args);
    };

    console.log = (...args) => {
        if (typeof args[0] === 'string') {
            if (args[0].includes('i18next is maintained')) return;
            if (args[0].includes('Download the React DevTools')) return;
        }
        originalLog(...args);
    };
} else {
    // В production — полное подавление (чтобы не раскрывать стек-трейсы, имена таблиц и т.д.)
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.debug = () => {};
}
