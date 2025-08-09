import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen animated-bg flex items-center justify-center">
          <div className="glass-dark rounded-xl p-8 max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Space Traffic Dashboard
            </h1>
            <p className="text-gray-400 mb-6">
              Something went wrong with the satellite tracking system.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-accent-blue to-accent-green text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
            >
              Reload Dashboard
            </button>
            <div className="mt-4 text-xs text-gray-500">
              Error: {this.state.error?.message}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
