import Link from 'next/link';
import { Map } from 'lucide-react';
import type { PlaceData } from '@/types/region';
import PlaceCard from './PlaceCard';

interface TravelSectionProps {
  regionCode: string;
  regionName: string;
  places: PlaceData[];
  isLoading?: boolean;
}

/**
 * 여행/명소 섹션 컴포넌트
 * SSR 가능 - 서버 컴포넌트에서 사용 가능
 */
export default function TravelSection({ regionCode, regionName, places, isLoading }: TravelSectionProps) {
  const travelPlaces = places.filter(
    (p) => (p.category === 'attraction' || p.category === 'heritage' || p.category === 'nature') && p.thumbnail
  );

  if (isLoading) {
    return (
      <section className="mb-2">
        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-500" />
            {regionName} 여행 &amp; 명소
          </h2>
        </div>
        <div className="flex overflow-x-auto gap-4 px-4 pb-4 lg:grid lg:grid-cols-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[280px] lg:min-w-0 bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-2">
      <div className="px-4 flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-cyan-500" />
          {regionName} 여행 &amp; 명소
        </h2>
        <Link
          href={`/region/${regionCode}/travel`}
          className="text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-cyan-500"
        >
          더보기 &gt;
        </Link>
      </div>
      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 pb-4 lg:grid lg:grid-cols-2">
        {travelPlaces.slice(0, 4).map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            regionCode={regionCode}
            type="travel"
            variant="full"
          />
        ))}
        {travelPlaces.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400 dark:text-gray-500">
            <Map className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>여행지 정보를 준비 중입니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
