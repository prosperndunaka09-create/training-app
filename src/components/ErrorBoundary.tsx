import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Something went wrong</h1>
                <p className="text-slate-400 text-sm">The application encountered an error</p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                <p className="text-red-400 font-mono text-sm mb-2">Error:</p>
                <p className="text-slate-300 text-sm font-mono">{this.state.error.toString()}</p>
              </div>
            )}

            {this.state.errorInfo && (
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <p className="text-amber-400 font-mono text-sm mb-2">Component Stack:</p>
                <pre className="text-slate-400 text-xs overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
            >
              Reload Page
            </button>

            <p className="text-slate-500 text-xs text-center mt-4">
              Please try refreshing the page. If the problem persists, contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
