/**
 * RegionCard Molecule Component
 * 지역 선택 카드 - 시/도 또는 시/군/구 표시용
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Region, District } from '@/lib/national-regions';

export interface RegionCardProps {
  region?: Region;
  district?: District;
  href: string;
  newsCount?: number;
  isActive?: boolean;
  variant?: 'sido' | 'sigungu';
  className?: string;
}

export default function RegionCard({
  region,
  district,
  href,
  newsCount,
  isActive = false,
  variant = 'sido',
  className,
}: RegionCardProps) {
  const name = region?.name || district?.name || '';
  const shortName = region?.shortName || district?.name || '';
  const type = region?.type;

  const getIcon = () => {
    if (variant === 'sigungu') return '📍';
    if (type === 'metropolitan' || type === 'special') return '🏙️';
    return '🗺️';
  };

  const getTypeLabel = () => {
    if (!type) return '';
    const labels: Record<string, string> = {
      metropolitan: '광역시',
      special: '특별자치시',
      province: '도',
      'special-province': '특별자치도',
    };
    return labels[type] || '';
  };

  const baseStyles = cn(
    'group block p-4 rounded-xl border transition-all duration-200',
    variant === 'sido'
      ? 'bg-white hover:shadow-lg'
      : 'bg-white hover:shadow-md',
    isActive
      ? 'border-blue-500 bg-blue-50'
      : 'border-gray-200 hover:border-blue-500'
  );

  return (
    <Link href={href} className={cn(baseStyles, className)}>
      <div className="text-center">
        {/* 아이콘 */}
        <span className="block text-2xl mb-2">{getIcon()}</span>

        {/* 지역명 */}
        <span
          className={cn(
            'block font-medium',
            variant === 'sido' ? 'text-lg' : 'text-sm',
            isActive
              ? 'text-blue-600'
              : 'text-gray-900 group-hover:text-blue-600'
          )}
        >
          {variant === 'sido' ? shortName : name}
        </span>

        {/* 타입 라벨 (시/도만) */}
        {variant === 'sido' && type && (
          <span className="block text-xs text-gray-500 mt-1">
            {getTypeLabel()}
          </span>
        )}

        {/* 뉴스 수 또는 하위 지역 수 */}
        {newsCount !== undefined && (
          <span className="block text-xs text-gray-400 mt-1">
            {newsCount.toLocaleString()}건
          </span>
        )}

        {region?.districts && (
          <span className="block text-xs text-gray-400 mt-1">
            {region.districts.length}개{' '}
            {type === 'metropolitan' || type === 'special' ? '구/군' : '시/군'}
          </span>
        )}

        {/* 통합 지역 표시 */}
        {district?.mergedWith && district.mergedWith.length > 0 && (
          <span className="block text-xs text-blue-500 mt-1">
            +{district.mergedWith.length}개 통합
          </span>
        )}
      </div>
    </Link>
  );
}
