import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import MainSection, { MainSectionSkeleton } from '@/components/home/MainSection';
import RegionGrid, { RegionGridSkeleton } from '@/components/home/RegionGrid';
import Sidebar, { SidebarSkeleton } from '@/components/Sidebar';
import { getSiteConfig, isValidRegion } from '@/config/site-regions';

// Revalidate every 60 seconds
export const revalidate = 60;

interface RegionHomeProps {
    params: Promise<{ region: string }>;
}

// Generate metadata for each region
export async function generateMetadata({ params }: RegionHomeProps) {
    const { region } = await params;
    const config = getSiteConfig(region);

    return {
        title: `${config.name} | 코리아NEWS`,
        description: `${config.name} ${config.subtitle}`,
    };
}

/**
 * Korea NEWS Regional Homepage
 * ============================
 * Path-based routing: koreanewskorea.com/{region}
 *
 * Layout Structure:
 *   1. Main Section (Featured Article + Sub-News)
 *   2. Two-Column Layout:
 *      - Left (70%): Region Grid
 *      - Right (30%): Sidebar (Most Viewed, Latest, Quick Links)
 */
export default async function RegionHome({ params }: RegionHomeProps) {
    const { region } = await params;

    if (!isValidRegion(region)) {
        notFound();
    }

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
