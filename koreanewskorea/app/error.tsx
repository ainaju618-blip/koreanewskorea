'use client';

import { useEffect } from 'react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 max-w-md">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Something went wrong
                </h1>
                <p className="text-slate-600 mb-6">
                    An error occurred while loading this page.
                    We apologize for the inconvenience.
                </p>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
