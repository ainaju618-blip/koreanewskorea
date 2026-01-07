'use client';
import {
  UtilityBar,
  DesktopHeader,
  BreakingNewsTicker,
  DesktopLayout,
  DesktopFooter,
  WeatherWidget,
  PopularNewsSidebar,
  NewsletterForm,
  AdBanner,
  RegionMapWidget,
} from '@/components/stitch-v2';

const breakingNews = [
  { id: '1', title: '[속보] 전국 폭염 특보 발령', url: '#' },
  { id: '2', title: '[속보] 국회, 예산안 본회의 통과', url: '#' },
  { id: '3', title: '[속보] 한국은행, 기준금리 동결 결정', url: '#' },
];

export default function DesktopDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UtilityBar />
      <DesktopHeader />
      <BreakingNewsTicker items={breakingNews} />
      <DesktopLayout
        sidebar={
          <>
            <WeatherWidget />
            <PopularNewsSidebar />
            <AdBanner />
            <RegionMapWidget />
            <NewsletterForm />
          </>
        }
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-4">메인 콘텐츠 영역</h1>
          <p className="text-gray-600 dark:text-gray-400">
            여기에 뉴스 카드, 기사 등이 들어갑니다.
          </p>
        </div>
      </DesktopLayout>
      <DesktopFooter />
    </div>
  );
}
