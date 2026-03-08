import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

class ComponentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ComponentErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-black/40 border border-red-500/20 rounded-2xl text-center backdrop-blur-sm animate-fade-in-up m-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="text-red-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 font-heading">Ошибка компонента</h3>
                    <p className="text-gaming-textMuted max-w-md mx-auto mb-6 text-sm">
                        Произошла ошибка при загрузке этой части страницы. Попробуйте перезагрузить страницу или открыть заново.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5"
                    >
                        <RotateCcw size={18} />
                        <span>Перезагрузить</span>
                    </button>
                    {import.meta.env.DEV && this.state.error && (
                        <div className="mt-6 text-left w-full max-w-2xl overflow-auto bg-black/50 border border-white/10 p-4 rounded-lg text-red-300 text-xs font-mono break-words">
                            {this.state.error.toString()}
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ComponentErrorBoundary;
