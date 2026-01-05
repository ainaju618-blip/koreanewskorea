'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Map } from 'lucide-react';

/**
 * MapWidget - 사이드바용 소형 지도 위젯
 * ======================================
 * 17개 시도 소형 인터랙티브 지도
 * 호버 시 지역명 표시, 클릭 시 지역 페이지 이동
 */

interface RegionData {
  name: string;
  path: string;
  color: string;
}

// 축소된 좌표로 재조정된 지역 데이터
const REGIONS: Record<string, RegionData> = {
  seoul: { name: '서울', path: 'M62,42 L65,40 L70,41 L71,45 L69,47 L64,46 Z', color: '#DC2626' },
  busan: { name: '부산', path: 'M117,122 L125,120 L127,125 L124,130 L117,127 Z', color: '#EA580C' },
  daegu: { name: '대구', path: 'M100,97 L107,95 L110,100 L105,105 L97,102 Z', color: '#D97706' },
  incheon: { name: '인천', path: 'M50,45 L57,42 L60,47 L55,51 L49,49 Z', color: '#0891B2' },
  gwangju: { name: '광주', path: 'M52,120 L60,117 L62,122 L57,127 L50,125 Z', color: '#7C3AED' },
  daejeon: { name: '대전', path: 'M72,82 L80,80 L82,85 L77,90 L70,87 Z', color: '#2563EB' },
  ulsan: { name: '울산', path: 'M125,107 L132,105 L135,110 L130,115 L122,112 Z', color: '#059669' },
  sejong: { name: '세종', path: 'M70,72 L75,71 L76,75 L72,77 L69,76 Z', color: '#6366F1' },
  gyeonggi: { name: '경기', path: 'M52,35 L77,32 L82,50 L80,65 L60,67 L47,55 Z', color: '#10B981' },
  gangwon: { name: '강원', path: 'M82,27 L117,25 L122,60 L100,72 L82,65 Z', color: '#14B8A6' },
  chungbuk: { name: '충북', path: 'M77,62 L97,60 L100,80 L80,87 L75,77 Z', color: '#8B5CF6' },
  chungnam: { name: '충남', path: 'M42,65 L72,62 L77,87 L50,97 L35,82 Z', color: '#EC4899' },
  jeonbuk: { name: '전북', path: 'M37,97 L70,90 L72,110 L47,117 L32,107 Z', color: '#F59E0B' },
  jeonnam: { name: '전남', path: 'M27,117 L65,110 L70,145 L35,155 L20,135 Z', color: '#84CC16' },
  gyeongbuk: { name: '경북', path: 'M97,57 L130,52 L135,97 L107,107 L90,87 Z', color: '#EF4444' },
  gyeongnam: { name: '경남', path: 'M72,110 L115,100 L122,135 L80,147 L65,130 Z', color: '#3B82F6' },
  jeju: { name: '제주', path: 'M40,175 L65,172 L67,185 L42,187 Z', color: '#06B6D4' },
};

export default function MapWidget() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-100/80">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 flex items-center gap-2.5">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Map className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-white text-[15px] tracking-tight">전국 지도</h3>
      </div>

      {/* Map SVG */}
      <div className="relative p-4">
        <svg
          viewBox="0 0 150 200"
          className="w-full h-auto"
          style={{ aspectRatio: '3/4' }}
        >
          {/* 바다 배경 */}
          <rect x="0" y="0" width="150" height="200" fill="#E0F2FE" rx="8" />

          {/* 지역들 렌더링 */}
          {Object.entries(REGIONS).map(([key, region]) => (
            <Link key={key} href={`/region/${key}`}>
              <g
                onMouseEnter={() => setHoveredRegion(key)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-pointer"
              >
                <path
                  d={region.path}
                  fill={hoveredRegion === key ? region.color : '#E2E8F0'}
                  stroke={region.color}
                  strokeWidth={hoveredRegion === key ? 1.5 : 0.5}
                  opacity={hoveredRegion === key ? 1 : 0.8}
                  className="transition-all duration-150"
                />
              </g>
            </Link>
          ))}
        </svg>

        {/* 호버 툴팁 */}
        {hoveredRegion && REGIONS[hoveredRegion] && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur rounded-lg shadow-lg p-2 border border-slate-200">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: REGIONS[hoveredRegion].color }}
              />
              <span className="font-bold text-sm text-slate-900">
                {REGIONS[hoveredRegion].name}
              </span>
              <span className="text-xs text-slate-500 ml-auto">클릭하여 이동</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-1.5">
          {['seoul', 'busan', 'gwangju', 'jeju'].map((key) => (
            <Link
              key={key}
              href={`/region/${key}`}
              className="py-2 text-xs text-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {REGIONS[key].name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton
export function MapWidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-100/80">
      <div className="bg-gradient-to-r from-slate-200 to-slate-300 h-14 animate-pulse" />
      <div className="p-4">
        <div className="aspect-[3/4] bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
