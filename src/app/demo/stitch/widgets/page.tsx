'use client';
import {
  WeatherWidget,
  PopularNewsSidebar,
  NewsletterForm,
  AdBanner,
  RegionMapWidget,
} from '@/components/stitch-v2';

export default function WidgetsDemo() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center mb-8">사이드바 위젯</h1>
        <WeatherWidget />
        <PopularNewsSidebar />
        <RegionMapWidget />
        <NewsletterForm />
        <AdBanner />
      </div>
    </div>
  );
}
