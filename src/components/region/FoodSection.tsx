import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import type { PlaceData } from '@/types/region';
import PlaceCard from './PlaceCard';

interface FoodSectionProps {
  regionCode: string;
  regionName: string;
  places: PlaceData[];
  isLoading?: boolean;
}

/**
 * 맛집 섹션 컴포넌트
 * SSR 가능 - 서버 컴포넌트에서 사용 가능
 */
export default function FoodSection({ regionCode, regionName, places, isLoading }: FoodSectionProps) {
  const foodPlaces = places.filter(
    (p) => (p.category === 'restaurant' || p.category === 'cafe') && p.thumbnail
  );

  if (isLoading) {
    return (
      <section className="px-4 mb-2 lg:bg-white lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100 lg:mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-cyan-500" />
            {regionName}의 맛
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-40" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-2 lg:bg-white lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100 lg:mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-cyan-500" />
          {regionName}의 맛
        </h2>
        <Link
          href={`/region/${regionCode}/food`}
          className="text-gray-500 text-xs font-medium hover:text-cyan-500"
        >
          더보기 &gt;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {foodPlaces.slice(0, 4).map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            regionCode={regionCode}
            type="food"
            variant="compact"
          />
        ))}
        {foodPlaces.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>맛집 정보를 준비 중입니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
