// src/app/admin/loading.tsx
// Admin dashboard loading skeleton UI (Next.js 15 Streaming) - Dark Mode

export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-[#0d1117]">
            <div className="max-w-[1440px] mx-auto px-8 py-10">

                {/* Header Skeleton */}
                <header className="mb-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="h-8 w-48 bg-[#21262d] animate-pulse rounded mb-2" />
                            <div className="h-4 w-32 bg-[#161b22] animate-pulse rounded" />
                        </div>
                        <div className="h-10 w-24 bg-[#21262d] animate-pulse rounded-xl" />
                    </div>
                </header>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] shadow-sm">
                            <div className="h-5 w-5 bg-[#21262d] animate-pulse rounded mb-4" />
                            <div className="h-10 w-20 bg-[#21262d] animate-pulse rounded mb-2" />
                            <div className="h-4 w-16 bg-[#161b22] animate-pulse rounded" />
                        </div>
                    ))}
                </div>

                {/* Main Grid Skeleton */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Region Stats Skeleton */}
                        <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] shadow-sm">
                            <div className="h-6 w-40 bg-[#21262d] animate-pulse rounded mb-6" />
                            <div className="grid grid-cols-4 gap-2">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-12 bg-[#21262d] animate-pulse rounded-lg" />
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions Skeleton */}
                        <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] shadow-sm">
                            <div className="h-5 w-24 bg-[#21262d] animate-pulse rounded mb-4" />
                            <div className="grid grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-20 bg-[#21262d] animate-pulse rounded-xl" />
                                ))}
                            </div>
                        </div>

                        {/* Bot Activity Skeleton */}
                        <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] shadow-sm">
                            <div className="h-5 w-32 bg-[#21262d] animate-pulse rounded mb-4" />
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-12 bg-[#21262d] animate-pulse rounded-lg" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* System Status Skeleton */}
                        <div className="rounded-2xl p-6 bg-[#21262d]">
                            <div className="h-5 w-28 bg-[#30363d] animate-pulse rounded mb-4" />
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-6 bg-[#30363d] animate-pulse rounded" />
                                ))}
                            </div>
                        </div>

                        {/* Usage Skeleton */}
                        <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] shadow-sm">
                            <div className="h-5 w-28 bg-[#21262d] animate-pulse rounded mb-4" />
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-4 bg-[#21262d] animate-pulse rounded" />
                                ))}
                            </div>
                        </div>

                        {/* Test Scheduler Skeleton */}
                        <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] shadow-sm">
                            <div className="h-5 w-24 bg-[#21262d] animate-pulse rounded mb-4" />
                            <div className="h-10 bg-[#21262d] animate-pulse rounded-xl" />
                        </div>

                        {/* Navigation Skeleton */}
                        <div className="bg-[#161b22] rounded-2xl p-4 border border-[#30363d] shadow-sm">
                            <div className="space-y-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-10 bg-[#21262d] animate-pulse rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
