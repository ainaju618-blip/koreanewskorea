import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchRegionData, getRegionInfo } from '@/lib/region-data';
import {
  HeroBanner,
  NewsTabs,
  TravelSection,
  FoodSection,
  SidebarTabs,
  NewsHeroSlider,
  SidebarBanners,
  RegionBottomNav,
} from '@/components/region';
import WeatherWidgetWrapper from './WeatherWidgetWrapper';
import DesktopLayout from '@/components/stitch-v2/layout/DesktopLayout';

// SSR with revalidation
export const revalidate = 60;

// SEO Metadata
export const metadata: Metadata = {
  title: '나주시 - 코리아NEWS',
  description: '나주시 뉴스, 시정소식, 시의회, 교육청 보도자료, 맛집, 여행 정보를 제공합니다.',
  keywords: ['나주', '나주시', '나주뉴스', '나주시청', '나주시의회', '나주교육지원청', '나주배', '나주곰탕'],
  openGraph: {
    title: '나주시 - 코리아NEWS',
    description: '나주시 뉴스, 시정소식, 시의회, 교육청 보도자료, 맛집, 여행 정보',
    type: 'website',
    locale: 'ko_KR',
  },
};

/**
 * 나주시 지역 페이지
 * SSR + 클라이언트 컴포넌트 하이브리드
 *
 * 3단계 시군구 페이지 템플릿
 * - 뉴스: 시군청 / 시군의회 / 교육청 (3단계 정규화)
 * - 맛집/여행: 카카오맵 연동
 */
export default async function NajuRegionPage() {
  const regionCode = 'naju';
  const region = getRegionInfo(regionCode);

  if (!region) {
    return <div>지역 정보를 찾을 수 없습니다.</div>;
  }

  // Server-side data fetching
  const { news, weather, events, regionalEvents, places } = await fetchRegionData(regionCode);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner - Server Component (데스크톱만 표시) */}
      <HeroBanner region={region} className="hidden lg:block" />

      {/* Spacer between Hero Banner and Main Content (데스크톱만) */}
      <div className="h-8 hidden lg:block" />

      {/* 모바일 전용 상단 여백 */}
      <div className="h-4 lg:hidden" />

      {/* Hero Section - NewsHeroSlider + SidebarBanners (8:4 Grid) */}
      {/* DesktopLayout과 동일한 컨테이너 설정: max-w-[1280px], px-4 lg:px-8, gap-6 */}
      <div className="w-full max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: News Hero Slider (8 cols) */}
          <div className="lg:col-span-8">
            <NewsHeroSlider
              articles={news}
              interval={6000}
              regionName={region.name}
            />
          </div>
          {/* Right: Sidebar Banners (4 cols) - 높이를 슬라이더와 맞춤 */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-auto lg:h-full">
              <SidebarBanners className="h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - DesktopLayout (8:4 Grid) */}
      <DesktopLayout
        mainCols={8}
        sidebarCols={4}
        gap="md"
        sidebar={
          <div className="space-y-6">
            {/* Food Section - Server Component */}
            <FoodSection
              regionCode={regionCode}
              regionName={region.name}
              places={places}
            />

            {/* Sidebar Tabs (전국축제/지역축제/문화유적) - Client Component */}
            <SidebarTabs events={events} regionalEvents={regionalEvents} places={places} />
          </div>
        }
      >

        {/* Weather Section - Client Component (임시 비활성화)
        <Suspense fallback={<WeatherSkeleton />}>
          <WeatherWidgetWrapper
            regionName={`전라남도 ${region.name} 빛가람동`}
            weather={weather}
          />
        </Suspense>
        */}

        {/* News Section - Client Component (for tab interaction) */}
        <div className="mt-6">
          <NewsTabs
            regionCode={regionCode}
            regionName={region.name}
            articles={news}
          />
        </div>

        {/* Divider (Mobile only) */}
        <div className="h-2 bg-gray-100 dark:bg-gray-800 my-6 lg:hidden" />

        {/* Food Section - 모바일 전용 (데스크톱에서는 사이드바에 표시) */}
        <div className="lg:hidden">
          <FoodSection
            regionCode={regionCode}
            regionName={region.name}
            places={places}
          />
        </div>

        {/* Divider (Mobile only) */}
        <div className="h-2 bg-gray-100 dark:bg-gray-800 my-6 lg:hidden" />

        {/* Travel Section - Server Component */}
        <TravelSection
          regionCode={regionCode}
          regionName={region.name}
          places={places}
        />
      </DesktopLayout>

      {/* Mobile Bottom Navigation - 모바일 전용 */}
      <RegionBottomNav regionCode={regionCode} />

      {/* Bottom safe area spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}

// Loading skeletons
function WeatherSkeleton() {
  return (
    <section className="p-4">
      <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 p-5 shadow-lg text-white animate-pulse">
        <div className="h-4 bg-white/20 rounded w-40 mb-2" />
        <div className="h-8 bg-white/20 rounded w-32 mb-2" />
        <div className="h-4 bg-white/20 rounded w-56" />
      </div>
    </section>
  );
}
