'use client';

// Skeleton UI for Personalized News Section
// Displays loading state with animated placeholders

export default function PersonalizedNewsSkeleton() {
    return (
        <div className="animate-pulse">
            {/* My Region Section Skeleton */}
            <div className="mb-8">
                {/* Header */}
                <div className="border-t-4 border-slate-200 pt-3 mb-5">
                    <div className="h-6 w-40 bg-slate-200 rounded" />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Main Article */}
                    <div>
                        <div className="aspect-video bg-slate-200 rounded-lg mb-3" />
                        <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-slate-200 rounded w-full mb-1" />
                        <div className="h-4 bg-slate-200 rounded w-2/3" />
                    </div>

                    {/* Sub Articles */}
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3 p-2">
                                <div className="w-20 h-16 bg-slate-200 rounded flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 bg-slate-200 rounded w-full mb-1" />
                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-slate-200 rounded w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Nearby Section Skeleton */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                <div className="border-t-4 border-slate-200 pt-3 mb-4">
                    <div className="h-5 w-32 bg-slate-200 rounded" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-8 w-16 bg-slate-200 rounded-full" />
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-3 bg-white p-3 rounded-lg">
                            <div className="w-20 h-16 bg-slate-200 rounded flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-3 bg-slate-200 rounded w-16 mb-2" />
                                <div className="h-4 bg-slate-200 rounded w-full mb-1" />
                                <div className="h-4 bg-slate-200 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
