'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface RegionNewsCount {
  region: string;
  code: string;
  count: number;
  href: string;
}

interface RegionMapWidgetProps {
  title?: string;
  regions?: RegionNewsCount[];
  className?: string;
  onRegionSelect?: (regionCode: string) => void;
}

const defaultRegions: RegionNewsCount[] = [
  { region: '서울', code: 'seoul', count: 128, href: '/region/seoul' },
  { region: '경기', code: 'gyeonggi', count: 95, href: '/region/gyeonggi' },
  { region: '인천', code: 'incheon', count: 42, href: '/region/incheon' },
  { region: '강원', code: 'gangwon', count: 31, href: '/region/gangwon' },
  { region: '충북', code: 'chungbuk', count: 28, href: '/region/chungbuk' },
  { region: '충남', code: 'chungnam', count: 35, href: '/region/chungnam' },
  { region: '대전', code: 'daejeon', count: 25, href: '/region/daejeon' },
  { region: '세종', code: 'sejong', count: 18, href: '/region/sejong' },
  { region: '전북', code: 'jeonbuk', count: 29, href: '/region/jeonbuk' },
  { region: '전남', code: 'jeonnam', count: 33, href: '/region/jeonnam' },
  { region: '광주', code: 'gwangju', count: 22, href: '/region/gwangju' },
  { region: '경북', code: 'gyeongbuk', count: 38, href: '/region/gyeongbuk' },
  { region: '경남', code: 'gyeongnam', count: 41, href: '/region/gyeongnam' },
  { region: '대구', code: 'daegu', count: 27, href: '/region/daegu' },
  { region: '울산', code: 'ulsan', count: 19, href: '/region/ulsan' },
  { region: '부산', code: 'busan', count: 45, href: '/region/busan' },
  { region: '제주', code: 'jeju', count: 24, href: '/region/jeju' },
];

export default function RegionMapWidget({
  title = '지역별 뉴스',
  regions = defaultRegions,
  className = '',
  onRegionSelect,
}: RegionMapWidgetProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (regionCode: string) => {
    setSelectedRegion(regionCode);
    onRegionSelect?.(regionCode);
  };

  const getRegionColor = (count: number) => {
    if (count >= 100) return 'bg-primary dark:bg-primary-light';
    if (count >= 50) return 'bg-primary/80 dark:bg-primary-light/80';
    if (count >= 30) return 'bg-primary/60 dark:bg-primary-light/60';
    return 'bg-primary/40 dark:bg-primary-light/40';
  };

  const sortedRegions = [...regions].sort((a, b) => b.count - a.count);

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-xl text-primary dark:text-primary-light">
          map
        </span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>

      {/* Region Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {sortedRegions.slice(0, 8).map((region) => (
          <Link
            key={region.code}
            href={region.href}
            className={`
              relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all
              ${getRegionColor(region.count)}
              ${selectedRegion === region.code ? 'ring-2 ring-primary dark:ring-primary-light' : ''}
              ${hoveredRegion === region.code ? 'scale-105' : ''}
            `}
            onClick={() => handleRegionClick(region.code)}
            onMouseEnter={() => setHoveredRegion(region.code)}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <span className="text-xs font-medium text-white">{region.region}</span>
            <span className="text-[10px] text-white/80">{region.count}</span>
          </Link>
        ))}
      </div>

      {/* Region List */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {sortedRegions.slice(8).map((region) => (
            <Link
              key={region.code}
              href={region.href}
              className={`
                flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                ${selectedRegion === region.code ? 'bg-gray-100 dark:bg-gray-700' : ''}
              `}
              onClick={() => handleRegionClick(region.code)}
            >
              <span className="text-gray-700 dark:text-gray-300">{region.region}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{region.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* View All Link */}
      <Link
        href="/regions"
        className="mt-4 flex items-center justify-center gap-1 text-sm text-primary dark:text-primary-light hover:underline"
      >
        <span>전체 지역 보기</span>
        <span className="material-symbols-outlined text-base">chevron_right</span>
      </Link>
    </div>
  );
}
