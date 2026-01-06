import Link from 'next/link';
import Image from 'next/image';
import { Star, Navigation, Map, UtensilsCrossed } from 'lucide-react';
import type { PlaceData } from '@/types/region';

interface PlaceCardProps {
  place: PlaceData;
  regionCode: string;
  type: 'travel' | 'food';
  variant?: 'full' | 'compact';
}

/**
 * 장소 카드 컴포넌트 (여행/맛집)
 * SSR 가능 - 서버 컴포넌트에서 사용 가능
 */
export default function PlaceCard({ place, regionCode, type, variant = 'full' }: PlaceCardProps) {
  const href = `/region/${regionCode}/${type}/${place.id}`;
  const categoryLabel = getCategoryLabel(place.category);
  const PlaceholderIcon = type === 'food' ? UtensilsCrossed : Map;

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className="bg-white lg:bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="aspect-video relative overflow-hidden">
          {place.thumbnail ? (
            <Image
              src={place.thumbnail}
              alt={place.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-emerald-100 flex items-center justify-center">
              <PlaceholderIcon className="w-12 h-12 text-cyan-300" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h4 className="font-bold text-gray-900 text-sm truncate">{place.name}</h4>
          <p className="text-gray-500 text-xs mt-1">{categoryLabel}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="min-w-[280px] lg:min-w-0 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
    >
      <div className="aspect-video w-full relative">
        {place.thumbnail ? (
          <Image
            src={place.thumbnail}
            alt={place.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-emerald-100 flex items-center justify-center">
            <PlaceholderIcon className="w-12 h-12 text-cyan-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
          {categoryLabel}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-bold text-gray-900">{place.name}</h4>
          {place.rating > 0 && (
            <div className="flex items-center text-yellow-500 text-xs font-bold gap-0.5">
              <Star className="w-4 h-4 fill-yellow-500" />
              {place.rating}
            </div>
          )}
        </div>
        {place.description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
            {place.description}
          </p>
        )}
        <button className="w-full bg-cyan-50 hover:bg-cyan-100 text-cyan-600 text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors">
          <Navigation className="w-4 h-4" />
          길찾기
        </button>
      </div>
    </Link>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'heritage': '역사유적',
    'attraction': '관광명소',
    'restaurant': '맛집',
    'cafe': '카페',
    'nature': '자연명소',
  };
  return labels[category] || category;
}
