import React from 'react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Global Error Caught:", error, errorInfo);
        this.setState({ errorInfo });
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
                    <h1 style={{ color: '#ff49db', marginBottom: '1rem' }}>Что-то пошло не так :(</h1>
                    <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Произошла ошибка при отрисовке приложения.</p>

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

                    <button
                        onClick={() => window.location.reload()}
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
