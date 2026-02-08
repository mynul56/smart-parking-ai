'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to error reporting service (e.g., Sentry)
        console.error('Error Boundary caught:', error, errorInfo);

        // In production, send to monitoring service
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            // window.Sentry?.captureException(error);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                                <span className="text-2xl">❌</span>
                            </div>
                            <h2 className="mt-4 text-xl font-semibold text-center text-gray-900">
                                Something went wrong
                            </h2>
                            <p className="mt-2 text-sm text-center text-gray-600">
                                We're sorry for the inconvenience. Please refresh the page or contact support if the problem persists.
                            </p>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            )}
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-6 w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
