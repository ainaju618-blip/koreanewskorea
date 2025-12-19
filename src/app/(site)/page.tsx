import { Suspense } from 'react';
import NewsGrid, { NewsGridSkeleton } from '@/components/NewsGrid';
import Sidebar, { SidebarSkeleton } from '@/components/Sidebar';
import HomeHero from '@/components/home/HomeHero';

// Revalidate every 60 seconds - ensures fresh news data
export const revalidate = 60;

/**
 * Korea NEWS Homepage
 * ===================
 * Layout: 1400px Container (WebFrame Spec)
 * Style: Kangwon Ilbo Clone
 * 
 * [현대화] Suspense + Streaming 적용
 * - 각 섹션이 독립적으로 로딩되어 사용자가 빠르게 콘텐츠를 볼 수 있음
 */

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      {/* Container - Centered 1400px (WebFrame Spec) */}
      <div className="w-full max-w-[1400px] mx-auto px-4 py-8">

        {/* ===== ZONE 1: HERO SECTION (870px Main Visual) ===== */}
        <HomeHero />

        {/* ===== ZONE 2: SECTION GRIDS (Kangwon Ilbo Style) ===== */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN: Main Content (72%) */}
          <div className="w-full lg:w-[72%] space-y-0">

            {/* 광주 Gwangju - Streaming */}
            <Suspense fallback={<NewsGridSkeleton />}>
              <NewsGrid
                categoryName="광주"
                categoryNameEn="Gwangju"
                categorySlug="gwangju"
                limit={5}
              />
            </Suspense>

            {/* 전남 Jeonnam - Streaming */}
            <Suspense fallback={<NewsGridSkeleton />}>
              <NewsGrid
                categoryName="전남"
                categoryNameEn="Jeonnam"
                categorySlug="jeonnam"
                limit={5}
              />
            </Suspense>

            {/* 나주 Naju - Streaming */}
            <Suspense fallback={<NewsGridSkeleton />}>
              <NewsGrid
                categoryName="나주"
                categoryNameEn="Naju"
                categorySlug="jeonnam/naju"
                regionCode="naju"
                limit={5}
              />
            </Suspense>

            {/* 광주/전남 지역 네트워크 (Special Section) */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 my-8">
              <div className="border-t-4 border-[#A6121D] pt-3 mb-5">
                <h2 className="text-xl font-serif font-black text-slate-900 flex items-baseline gap-2">
                  지역 네트워크
                  <span className="text-sm text-slate-600 font-sans font-medium">Region</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Suspense fallback={<NewsGridSkeleton />}>
                  <NewsGrid
                    categoryName="광주"
                    categoryNameEn="Gwangju"
                    categorySlug="gwangju"
                    limit={3}
                  />
                </Suspense>
                <Suspense fallback={<NewsGridSkeleton />}>
                  <NewsGrid
                    categoryName="전남"
                    categoryNameEn="Jeonnam"
                    categorySlug="jeonnam"
                    limit={3}
                  />
                </Suspense>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar (28%) - Streaming */}
          <div className="w-full lg:w-[28%]">
            <div className="sticky top-[120px]">
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
