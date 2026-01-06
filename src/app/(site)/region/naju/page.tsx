import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchRegionData, getRegionInfo } from '@/lib/region-data';
import {
  HeroBanner,
  NewsTabs,
  TravelSection,
  FoodSection,
  SidebarTabs,
  SearchBar,
} from '@/components/region';
import WeatherWidgetWrapper from './WeatherWidgetWrapper';

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
  const { news, weather, events, places } = await fetchRegionData(regionCode);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner - Server Component */}
      <HeroBanner region={region} />

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-20 mb-4">
        <SearchBar regionCode={regionCode} regionName={region.name} />
      </div>

      <div className="max-w-7xl mx-auto pb-4">
        {/* Desktop: Two Column Layout */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:px-4 lg:py-6">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2">
            {/* Weather Section - Client Component */}
            <Suspense fallback={<WeatherSkeleton />}>
              <WeatherWidgetWrapper
                regionName={`전라남도 ${region.name} 빛가람동`}
                weather={weather}
              />
            </Suspense>

            {/* News Section - Client Component (for tab interaction) */}
            <NewsTabs
              regionCode={regionCode}
              regionName={region.name}
              articles={news}
            />

            {/* Divider */}
            <div className="h-2 bg-gray-100 my-6 lg:hidden" />

            {/* Travel Section - Server Component */}
            <TravelSection
              regionCode={regionCode}
              regionName={region.name}
              places={places}
            />
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1">
            {/* Divider (Mobile) */}
            <div className="h-2 bg-gray-100 my-6 lg:hidden" />

            {/* Food Section - Server Component */}
            <FoodSection
              regionCode={regionCode}
              regionName={region.name}
              places={places}
            />

            {/* Divider (Mobile) */}
            <div className="h-2 bg-gray-100 my-6 lg:hidden" />

            {/* Sidebar Tabs (Events/News/Heritage) - Client Component */}
            <SidebarTabs events={events} places={places} />
          </div>
        </div>
      </div>

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
