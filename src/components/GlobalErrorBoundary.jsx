import React from 'react';

// Определяем, является ли ошибка ошибкой загрузки чанка (после деплоя)
function isChunkLoadError(error) {
    const message = error?.message || '';
    return (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Loading chunk') ||
        message.includes('Loading CSS chunk') ||
        message.includes('Importing a module script failed')
    );
}

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, isChunkError: false };
    }

    static getDerivedStateFromError(error) {
        const isChunk = isChunkLoadError(error);

        // Если это ошибка чанка и мы ещё не перезагружались — перезагружаемся автоматически
        if (isChunk && !sessionStorage.getItem('chunk_reload')) {
            sessionStorage.setItem('chunk_reload', '1');
            window.location.reload();
            return { hasError: true, error, isChunkError: true };
        }

        // Сбрасываем флаг если уже перезагружались
        if (isChunk) {
            sessionStorage.removeItem('chunk_reload');
        }

        return { hasError: true, error, isChunkError: isChunk };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Global Error Caught:", error, errorInfo);
        this.setState({ errorInfo });
    }

    componentDidMount() {
        // Успешная загрузка — сбрасываем флаг перезагрузки
        sessionStorage.removeItem('chunk_reload');
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#1a1a2e',
                    color: '#fff',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <h1 style={{ color: '#ff49db', marginBottom: '1rem' }}>
                        {this.state.isChunkError
                            ? 'Обновление приложения...'
                            : 'Что-то пошло не так :('}
                    </h1>
                    <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
                        {this.state.isChunkError
                            ? 'Приложение было обновлено. Перезагрузите страницу для получения новой версии.'
                            : 'Произошла ошибка при отрисовке приложения.'}
                    </p>

                    {!this.state.isChunkError && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '0.5rem',
                            maxWidth: '800px',
                            width: '100%',
                            overflow: 'auto',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <code style={{ color: '#ff7eb3', display: 'block', marginBottom: '0.5rem' }}>
                                {this.state.error && this.state.error.toString()}
                            </code>
                            <pre style={{
                                fontSize: '0.8rem',
                                opacity: 0.6,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            sessionStorage.removeItem('chunk_reload');
                            window.location.reload();
                        }}
                        style={{
                            marginTop: '2rem',
                            padding: '0.75rem 2rem',
                            backgroundColor: '#7c3aed',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        Перезагрузить страницу
                    </button>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.reload();
                        }}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 2rem',
                            backgroundColor: 'transparent',
                            color: '#e2e8f0',
                            border: '1px solid #4a5568',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Сбросить кэш и перезагрузить
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;

