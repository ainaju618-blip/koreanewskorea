import Link from 'next/link';

/**
 * Divination Page - Coming Soon
 * TODO: Integrate yu-1 divination system when ready
 */
export default function DivinationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center px-4">
            {/* Stars background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.1)_0%,transparent_50%)]" />
            </div>

            <div className="relative text-center max-w-md">
                {/* Icon */}
                <div className="text-7xl mb-6 animate-pulse">
                    &#9775;
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-3">
                    Coming Soon
                </h1>

                {/* Subtitle */}
                <p className="text-purple-200 mb-2">
                    I Ching Divination Service
                </p>
                <p className="text-slate-400 text-sm mb-8">
                    Preparing mystical fortune telling powered by 3000 years of wisdom
                </p>

                {/* Back button */}
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-amber-500/20 border border-amber-400/30 text-amber-300 font-medium rounded-full hover:bg-amber-500/30 transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
