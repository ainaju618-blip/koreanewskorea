/**
 * RegionGrid Organism Component
 * 시/도 또는 시/군/구 그리드 표시
 */

import { cn } from '@/lib/utils';
import RegionCard from '@/components/molecules/RegionCard';
import {
  Region,
  District,
  buildRegionPath,
} from '@/lib/national-regions';

export interface RegionGridProps {
  title?: string;
  regions?: Region[];
  districts?: District[];
  sidoCode?: string; // districts 표시 시 필요
  activeCode?: string;
  variant?: 'sido' | 'sigungu';
  columns?: 2 | 3 | 4 | 5 | 6;
  showIcon?: boolean;
  className?: string;
}

export default function RegionGrid({
  title,
  regions,
  districts,
  sidoCode,
  activeCode,
  variant = 'sido',
  columns = 5,
  showIcon = true,
  className,
}: RegionGridProps) {
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  };

  // 시/도 그리드
  if (variant === 'sido' && regions) {
    return (
      <section className={className}>
        {title && (
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            {title}
          </h2>
        )}
        <div className={cn('grid gap-4', columnClasses[columns])}>
          {regions.map((region) => (
            <RegionCard
              key={region.code}
              region={region}
              href={buildRegionPath(region.code)}
              isActive={region.code === activeCode}
              variant="sido"
            />
          ))}
        </div>
      </section>
    );
  }

  // 시/군/구 그리드
  if (variant === 'sigungu' && districts && sidoCode) {
    const filteredDistricts = districts.filter((d) => d.isPrimary !== false);

    return (
      <section className={className}>
        {title && (
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            {title}
          </h2>
        )}
        <div className={cn('grid gap-3', columnClasses[columns])}>
          {filteredDistricts.map((district) => (
            <RegionCard
              key={district.code}
              district={district}
              href={buildRegionPath(sidoCode, district.code)}
              isActive={district.code === activeCode}
              variant="sigungu"
            />
          ))}
        </div>
      </section>
    );
  }

  return null;
}
