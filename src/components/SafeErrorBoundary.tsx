import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SafeErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Caught:', error, errorInfo);
    // Store error for debugging
    if (typeof window !== 'undefined') {
      (window as any).__APP_ERROR__ = { error: error.toString(), stack: error.stack, info: errorInfo };
    }
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = this.state.error ? this.state.error.toString() : 'Unknown error';
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'Arial, sans-serif',
          background: '#060a14',
          color: 'white',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>Something went wrong</h2>
            <p style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.8 }}>
              Error: {errorDetails.substring(0, 200)}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Reload Page
            </button>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: 'transparent',
                color: '#3498db',
                border: '1px solid #3498db',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function DelayedMount({ children, delay = 50 }: { children: React.ReactNode; delay?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
