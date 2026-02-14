import katex from 'katex';

/**
 * Обрабатывает HTML-строку, находит формулы в форматах:
 * - $$...$$ (блочные формулы, displayMode)
 * - $...$ (инлайн формулы)
 * и заменяет их на отрендеренный KaTeX HTML.
 */
export const renderKatex = (html) => {
    if (!html || typeof html !== 'string') return html;

    // Сначала обрабатываем блочные формулы $$...$$
    let result = html.replace(/\$\$([^$]+?)\$\$/g, (match, formula) => {
        try {
            return katex.renderToString(formula.trim(), {
                displayMode: true,
                throwOnError: false,
                output: 'html'
            });
        } catch (e) {
            console.warn('Ошибка рендеринга KaTeX:', e);
            return match;
        }
    });

    // Затем инлайн формулы $...$
    result = result.replace(/\$([^$]+?)\$/g, (match, formula) => {
        try {
            return katex.renderToString(formula.trim(), {
                displayMode: false,
                throwOnError: false,
                output: 'html'
            });
        } catch (e) {
            console.warn('Ошибка рендеринга KaTeX:', e);
            return match;
        }
    });

    return result;
};
