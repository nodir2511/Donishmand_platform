if (import.meta.env.DEV) {
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
}
