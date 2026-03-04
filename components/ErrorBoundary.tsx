import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    private handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-slate-800/80 border border-red-800/50 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
                        <div className="mx-auto w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle size={32} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                            <p className="text-slate-400 text-sm">
                                An unexpected error occurred. Please reload the page and try again.
                            </p>
                        </div>
                        {this.state.error && (
                            <pre className="text-xs text-red-300/70 bg-slate-900 rounded-lg p-3 overflow-auto max-h-32 text-left">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                        >
                            <RefreshCw size={18} />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
