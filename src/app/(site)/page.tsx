import { Suspense } from 'react';
import Sidebar, { SidebarSkeleton } from '@/components/Sidebar';
import NationalHero from '@/components/home/NationalHero';
import KoreaMapSection from '@/components/home/KoreaMapSection';
import NationalTourSection from '@/components/home/NationalTourSection';
import { OrganizationSchema } from '@/components/seo';
import { HeroSkeleton as HeroSkeletonAtom } from '@/components/atoms/Skeleton';

// Revalidate every 60 seconds - ensures fresh news data
export const revalidate = 60;

/**
 * 코리아뉴스 본사 (전국판) 메인 페이지
 * =====================================
 * 전국 단위 뉴스와 전국 여행정보를 표시
 *
 * 레이아웃:
 * - 상단: 전국 헤드라인 뉴스 (NationalHero)
 * - 중단: 전국 지도 인터랙티브 (KoreaMapSection)
 * - 하단: 전국 여행정보 (NationalTourSection)
 * - 우측: 사이드바
 *
 * ⚠️ 지역 기사는 지사(koreanewsone.com)에서 확인
 */

export default function Home() {
  return (
    <>
      {/* SEO: Organization Schema for AI and Google News */}
      <OrganizationSchema />

      {/* SEO: Screen-reader-only H1 for accessibility and SEO */}
      <h1 className="sr-only">코리아NEWS 전국판 - 대한민국 뉴스 포털</h1>

      <main id="main-content" className="min-h-screen bg-white font-sans" tabIndex={-1}>
        {/* Container - Centered 1400px */}
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8">

          {/* ===== ZONE 1: NATIONAL HERO SECTION ===== */}
          {/* 전국 뉴스 헤드라인 (정부기관 보도자료 기반) */}
          <Suspense fallback={<HeroSkeletonAtom />}>
            <NationalHero />
          </Suspense>

          {/* ===== MAIN CONTENT AREA ===== */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* LEFT COLUMN: Main Content (72%) */}
            <div className="w-full lg:w-[72%] space-y-0">

              {/* ===== ZONE 2: KOREA MAP SECTION ===== */}
              {/* 전국 지도 - 지역 클릭 시 해당 지역 페이지로 이동 */}
              <KoreaMapSection />

              {/* ===== ZONE 3: NATIONAL TOUR SECTION ===== */}
              {/* 전국 여행정보 (한국관광공사 TourAPI 기반) */}
              <Suspense fallback={<TourSkeleton />}>
                <NationalTourSection />
              </Suspense>

              {/* 지사 안내 배너 */}
              <BranchPromoBanner />

            </div>

            {/* RIGHT COLUMN: Sidebar (28%) */}
            <aside className="w-full lg:w-[28%]" aria-label="Sidebar">
              <div className="sticky top-[120px]">
                <Suspense fallback={<SidebarSkeleton />}>
                  <Sidebar />
                </Suspense>
              </div>
            </aside>

          </div>
        </div>
      </main>
    </>
  );
}

// Skeleton Components (HeroSkeleton은 atoms/Skeleton에서 import)

function TourSkeleton() {
  return (
    <div className="mb-10 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[3/2] bg-slate-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Branch Promo Banner
function BranchPromoBanner() {
  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            광주/전남 지역뉴스가 궁금하신가요?
          </h3>
          <p className="text-sm text-slate-600">
            코리아뉴스 지사에서 27개 시군구의 생생한 지역 소식을 만나보세요.
            IP 기반 자동 지역 감지로 나만의 지역 뉴스를 제공합니다.
          </p>
        </div>
        <a
          href="https://koreanewsone.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-6 py-3 bg-[#A6121D] text-white rounded-lg font-medium hover:bg-[#8a0f18] transition-colors"
        >
          지사 방문하기
        </a>
      </div>
    </div>
  );
}
