import { Suspense } from 'react';
import MainSection, { MainSectionSkeleton } from '@/components/home/MainSection';
import RegionGrid, { RegionGridSkeleton } from '@/components/home/RegionGrid';
import Sidebar, { SidebarSkeleton } from '@/components/Sidebar';

// Revalidate every 60 seconds
export const revalidate = 60;

/**
 * Korea NEWS Jeonnam - Gangwon Ilbo Style Homepage
 * =================================================
 * Design Philosophy:
 *   - Traditional newspaper layout (kwnews.co.kr inspired)
 *   - Primary Blue (#0066CC) brand identity
 *   - No shadows, minimal border-radius
 *   - ~1200px container width
 *   - Information-dense, clean layout
 *
 * Layout Structure:
 *   1. Main Section (Featured Article + Sub-News)
 *   2. Two-Column Layout:
 *      - Left (70%): Region Grid (22 cities/counties)
 *      - Right (30%): Sidebar (Most Viewed, Latest, Quick Links)
 */

export default function Home() {
    return (
        <main className="min-h-screen bg-white">
            {/* Container - 1200px max-width */}
            <div className="container-kn py-8">

                {/* ===== MAIN SECTION ===== */}
                {/* Featured Article (Left 60%) + Sub-News List (Right 40%) */}
                <Suspense fallback={<MainSectionSkeleton />}>
                    <MainSection />
                </Suspense>

                {/* ===== CONTENT AREA: Region Grid + Sidebar ===== */}
                <div className="flex flex-col lg:flex-row gap-8 mt-8">
                    {/* Main Content (70%) - Region Grid */}
                    <div className="w-full lg:w-[70%]">
                        <Suspense fallback={<RegionGridSkeleton />}>
                            <RegionGrid />
                        </Suspense>
                    </div>

                    {/* Sidebar (30%) - Most Viewed, Latest News, Quick Links */}
                    <div className="w-full lg:w-[30%]">
                        <div className="lg:sticky lg:top-[60px]">
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
