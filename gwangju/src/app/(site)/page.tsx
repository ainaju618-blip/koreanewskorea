import { Suspense } from 'react';
import HeroSection, { HeroSectionSkeleton } from '@/components/home/HeroSection';
import CategoryNewsGrid, { CategoryNewsGridSkeleton } from '@/components/home/CategoryNewsGrid';
import LatestNewsGrid, { LatestNewsGridSkeleton } from '@/components/home/LatestNewsGrid';
import Sidebar, { SidebarSkeleton } from '@/components/Sidebar';

// Revalidate every 60 seconds
export const revalidate = 60;

/**
 * Korea NEWS Gwangju - Unique Homepage
 * ====================================
 * Design Philosophy:
 *   - Korea Red (#A6121D) brand identity
 *   - Newspaper-style authority with modern elegance
 *   - Gwangju regional news focus
 *   - Clean, information-dense layout
 *
 * Layout Structure:
 *   1. Hero Section (Featured + Top Stories)
 *   2. Category News Grid (정치, 경제, 사회)
 *   3. Latest News + Sidebar (65% / 35%)
 */

export default function Home() {
    return (
        <main className="min-h-screen bg-slate-50">
            {/* Container - 1400px max-width */}
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

                {/* ===== HERO SECTION ===== */}
                <Suspense fallback={<HeroSectionSkeleton />}>
                    <HeroSection />
                </Suspense>

                {/* ===== CATEGORY NEWS GRID ===== */}
                <Suspense fallback={<CategoryNewsGridSkeleton />}>
                    <CategoryNewsGrid />
                </Suspense>

                {/* ===== LATEST NEWS + SIDEBAR ===== */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content (65%) */}
                    <div className="w-full lg:w-[65%]">
                        <Suspense fallback={<LatestNewsGridSkeleton />}>
                            <LatestNewsGrid />
                        </Suspense>
                    </div>

                    {/* Sidebar (35%) */}
                    <div className="w-full lg:w-[35%]">
                        <div className="lg:sticky lg:top-[80px]">
                            <Suspense fallback={<SidebarSkeleton />}>
                                <Sidebar />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
