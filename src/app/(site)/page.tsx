import { Suspense } from 'react';
import { OrganizationSchema } from '@/components/seo';
import MainHeroBanner from '@/components/home/MainHeroBanner';
import HeroSection from '@/components/home/HeroSection';
import MapSection from '@/components/home/MapSection';
import TravelSection from '@/components/home/TravelSection';

// Revalidate every 60 seconds - ensures fresh news data
export const revalidate = 60;

/**
 * 코리아뉴스 본사 (전국판) 메인 페이지
 * =====================================
 *
 * 신규 Stitch 디자인 레이아웃 (2025년 1월 개편):
 * - Hero: 메인뉴스 카드 + 정책 브리핑 사이드바 (7:5 비율)
 * - Map: 전국 뉴스 지도 + 실시간 뉴스 피드
 * - Travel: 추천 여행지 그리드 (4열)
 * - Banner: 지사 안내 배너
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

      <main id="main-content" className="min-h-screen bg-gray-50 font-sans" tabIndex={-1}>
        {/* ===== ZONE 0: MAIN HERO BANNER ===== */}
        {/* 풀와이드 히어로 배너 (배경 이미지 + 검색) */}
        <MainHeroBanner />

        {/* Container - max-w-7xl (1280px) */}
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 px-4 py-6">

          {/* ===== ZONE 1: HERO SECTION ===== */}
          {/* 메인 뉴스 + 정책 브리핑 (12컬럼 그리드: 7:5 비율) */}
          <Suspense fallback={<HeroSkeleton />}>
            <HeroSection />
          </Suspense>

          {/* Divider */}
          <div className="h-px bg-gray-200 w-full" aria-hidden="true" />

          {/* ===== ZONE 2: MAP + REALTIME SECTION ===== */}
          {/* 전국 뉴스 지도 + 실시간 뉴스 피드 (2열 그리드) */}
          <Suspense fallback={<MapSkeleton />}>
            <MapSection />
          </Suspense>

          {/* Divider */}
          <div className="h-px bg-gray-200 w-full" aria-hidden="true" />

          {/* ===== ZONE 3: TRAVEL SECTION ===== */}
          {/* 추천 여행지 그리드 (4열) */}
          <Suspense fallback={<TravelSkeleton />}>
            <TravelSection />
          </Suspense>

          {/* ===== ZONE 4: BRANCH PROMO BANNER ===== */}
          {/* 지사 안내 배너 */}
          <BranchPromoBanner />

        </div>
      </main>
    </>
  );
}

// ============================================
// Skeleton Components
// ============================================

function HeroSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      {/* Main Article Skeleton */}
      <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        <div className="aspect-video bg-slate-200" />
        <div className="p-5 space-y-3">
          <div className="h-7 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
      {/* Sidebar Skeleton */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 bg-slate-50/50">
          <div className="h-6 bg-slate-200 rounded w-40" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4">
              <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-16" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-24" />
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
      {/* Map Area */}
      <div className="flex flex-col gap-4">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="bg-slate-100 rounded-xl h-[300px]" />
      </div>
      {/* Realtime Feed */}
      <div className="flex flex-col gap-4">
        <div className="h-6 bg-slate-200 rounded w-24" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="w-12 h-4 bg-slate-200 rounded" />
              <div className="flex-1 h-4 bg-slate-200 rounded" />
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
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="h-4 bg-slate-200 rounded w-16" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-slate-200 rounded-xl" />
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
    <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
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
          className="flex-shrink-0 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          지사 방문하기
        </a>
      </div>
    </div>
  );
}
