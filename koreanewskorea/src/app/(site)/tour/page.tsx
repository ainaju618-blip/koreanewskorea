import { Suspense } from 'react';
import { Metadata } from 'next';
import TourHero from '@/components/tour/TourHero';
import TourSpots from '@/components/tour/TourSpots';
import TourFood from '@/components/tour/TourFood';
import TourEvents from '@/components/tour/TourEvents';
import TourAccommodation from '@/components/tour/TourAccommodation';
import Sidebar, { SidebarSkeleton } from '@/components/Sidebar';
import { CURRENT_SITE } from '@/config/site-regions';

// Revalidate every hour (tourism data doesn't change frequently)
export const revalidate = 3600;

export const metadata: Metadata = {
    title: `${CURRENT_SITE.name} 관광정보`,
    description: `${CURRENT_SITE.name} 지역 관광명소, 맛집, 숙박, 축제 정보를 한눈에`,
};

/**
 * Korea NEWS Regional - Tourism Information Page
 * ==============================================
 * Data Sources:
 *   - Korea Tourism Organization API (한국관광공사)
 *   - Public Data Portal (공공데이터포털)
 *   - Local government tourism APIs
 *
 * Layout Structure:
 *   1. Hero Banner (Region-specific)
 *   2. Hot Spots (Today's trending)
 *   3. Two-Column Layout:
 *      - Left (70%): Tour Spots, Food, Events
 *      - Right (30%): Sidebar (Accommodation, Weather)
 */

export default function TourPage() {
    const regionKeys = CURRENT_SITE.regions.primary.slugs;
    const regionName = CURRENT_SITE.name;

    return (
        <main className="min-h-screen bg-white">
            {/* Container - 1200px max-width */}
            <div className="container-kn py-8">

                {/* ===== HERO BANNER ===== */}
                <Suspense fallback={<TourHeroSkeleton />}>
                    <TourHero regionName={regionName} regionKeys={regionKeys} />
                </Suspense>

                {/* ===== CONTENT AREA ===== */}
                <div className="flex flex-col lg:flex-row gap-8 mt-8">
                    {/* Main Content (70%) */}
                    <div className="w-full lg:w-[70%] space-y-8">
                        {/* Tour Spots - Ranking */}
                        <Suspense fallback={<SectionSkeleton title="관광명소" />}>
                            <TourSpots regionKeys={regionKeys} />
                        </Suspense>

                        {/* Food Recommendations */}
                        <Suspense fallback={<SectionSkeleton title="맛집 추천" />}>
                            <TourFood regionKeys={regionKeys} />
                        </Suspense>

                        {/* Local Events */}
                        <Suspense fallback={<SectionSkeleton title="축제/행사" />}>
                            <TourEvents regionKeys={regionKeys} />
                        </Suspense>
                    </div>

                    {/* Sidebar (30%) */}
                    <div className="w-full lg:w-[30%]">
                        <div className="lg:sticky lg:top-[60px] space-y-6">
                            {/* Accommodation */}
                            <Suspense fallback={<SectionSkeleton title="숙박" />}>
                                <TourAccommodation regionKeys={regionKeys} />
                            </Suspense>

                            {/* News Sidebar */}
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

// Skeleton Components
function TourHeroSkeleton() {
    return (
        <div className="relative aspect-[21/9] bg-gray-200 animate-pulse">
            <div className="absolute bottom-8 left-8">
                <div className="w-64 h-10 bg-gray-300 mb-4" />
                <div className="w-96 h-6 bg-gray-300" />
            </div>
        </div>
    );
}

function SectionSkeleton({ title }: { title: string }) {
    return (
        <section>
            <div className="kn-section-header">
                <h2 className="kn-section-title">{title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[4/3] bg-gray-200 animate-pulse" />
                ))}
            </div>
        </section>
    );
}
