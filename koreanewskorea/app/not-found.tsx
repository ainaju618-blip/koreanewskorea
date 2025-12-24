import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 max-w-md">
                <div className="text-8xl font-bold text-slate-200 mb-4">404</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Page Not Found
                </h1>
                <p className="text-slate-600 mb-6">
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Go to Homepage
                </Link>
            </div>
        </div>
    );
}
