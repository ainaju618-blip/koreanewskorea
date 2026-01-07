import { Suspense } from 'react';
import { OrganizationSchema } from '@/components/seo';

// 기존 데이터 컴포넌트
import MainHeroBanner from '@/components/home/MainHeroBanner';
import HeroSection from '@/components/home/HeroSection';
import MapSection from '@/components/home/MapSection';
import TravelSection from '@/components/home/TravelSection';

// Stitch v2 데스크탑 레이아웃 컴포넌트
import {
  BreakingNewsTicker,
  DesktopLayout,
  WeatherWidget,
  PopularNewsSidebar,
  NewsletterForm,
  RegionMapWidget,
} from '@/components/stitch-v2';

// Revalidate every 60 seconds - ensures fresh news data
export const revalidate = 60;

// 속보 데이터 (추후 API 연동)
const breakingNews = [
  { id: '1', title: '[속보] 전국 17개 시·도 새해 업무 시작', url: '/news/1' },
  { id: '2', title: '[속보] 코리아뉴스, 전국판 서비스 개시', url: '/news/2' },
  { id: '3', title: '[속보] 지방자치단체 예산안 심의 본격화', url: '/news/3' },
];

/**
 * 코리아뉴스 본사 (전국판) 메인 페이지
 * =====================================
 *
 * Stitch v2 디자인 시스템 적용 (2026년 1월):
 * - 헤더/푸터: layout.tsx의 StitchHeader/StitchFooter 사용
 * - BreakingNewsTicker: 속보 롤링 배너
 * - DesktopLayout: 12컬럼 그리드 (메인 8 + 사이드바 4)
 * - 사이드바 위젯: WeatherWidget, PopularNewsSidebar, RegionMapWidget, NewsletterForm
 *
 * 백업: page.tsx.backup
 */

export default function Home() {
  return (
    <>
      {/* SEO: Organization Schema for AI and Google News */}
      <OrganizationSchema />

      {/* SEO: Screen-reader-only H1 for accessibility and SEO */}
      <h1 className="sr-only">코리아NEWS 전국판 - 대한민국 뉴스 포털</h1>

      {/* Stitch v2 데스크탑 레이아웃 */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 속보 티커 */}
        <BreakingNewsTicker items={breakingNews} />

        {/* 메인 콘텐츠 영역 (12컬럼 그리드) */}
        <DesktopLayout
          sidebar={
            <div className="space-y-6">
              <WeatherWidget />
              <PopularNewsSidebar />
              <RegionMapWidget />
              <NewsletterForm />
            </div>
          }
        >
          <main id="main-content" className="space-y-8" tabIndex={-1}>
            {/* ===== ZONE 0: MAIN HERO BANNER ===== */}
            <MainHeroBanner />

            {/* ===== ZONE 1: HERO SECTION ===== */}
            <Suspense fallback={<HeroSkeleton />}>
              <HeroSection />
            </Suspense>

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" aria-hidden="true" />

            {/* ===== ZONE 2: MAP + REALTIME SECTION ===== */}
            <Suspense fallback={<MapSkeleton />}>
              <MapSection />
            </Suspense>

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" aria-hidden="true" />

            {/* ===== ZONE 3: TRAVEL SECTION ===== */}
            <Suspense fallback={<TravelSkeleton />}>
              <TravelSection />
            </Suspense>

            {/* ===== ZONE 4: BRANCH PROMO BANNER ===== */}
            <BranchPromoBanner />
          </main>
        </DesktopLayout>

      </div>
    </>
  );
}

// ============================================
// Skeleton Components
// ============================================

function HeroSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
        <div className="p-5 space-y-3">
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        </div>
      </div>
      <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4">
              <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MapSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-[300px]" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TravelSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

// ============================================
// Branch Promo Banner
// ============================================

function BranchPromoBanner() {
  return (
    <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            광주/전남 지역뉴스가 궁금하신가요?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            코리아뉴스 지사에서 27개 시군구의 생생한 지역 소식을 만나보세요.
            IP 기반 자동 지역 감지로 나만의 지역 뉴스를 제공합니다.
          </p>
        </div>
        <a
          href="https://koreanewsone.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          지사 방문하기
        </a>
      </div>
    </div>
  );
}
