import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Algo salió mal</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Lo sentimos, ha ocurrido un error inesperado al cargar esta página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-[#F5B027] text-white rounded-xl font-bold hover:bg-[#E5A017] transition-colors shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Recargar página
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left text-xs overflow-auto max-w-full text-red-600 dark:text-red-400">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
