'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Korea Map Section - 본사(전국판) 전국 지도 섹션
 * ================================================
 * 인터랙티브 대한민국 지도
 * 각 지역 클릭 시 해당 지역 페이지로 이동
 */

// 지역 타입 정의
interface RegionData {
  name: string;
  nameEn: string;
  path: string;
  color: string;
  highlight?: boolean;
}

// 지역 데이터
const REGIONS: Record<string, RegionData> = {
  // 광역시/특별시
  seoul: { name: '서울', nameEn: 'Seoul', path: 'M125,85 L130,80 L140,82 L142,90 L138,95 L128,93 Z', color: '#DC2626' },
  busan: { name: '부산', nameEn: 'Busan', path: 'M235,245 L250,240 L255,250 L248,260 L235,255 Z', color: '#EA580C' },
  daegu: { name: '대구', nameEn: 'Daegu', path: 'M200,195 L215,190 L220,200 L210,210 L195,205 Z', color: '#D97706' },
  incheon: { name: '인천', nameEn: 'Incheon', path: 'M100,90 L115,85 L120,95 L110,102 L98,98 Z', color: '#0891B2' },
  gwangju: { name: '광주', nameEn: 'Gwangju', path: 'M105,240 L120,235 L125,245 L115,255 L100,250 Z', color: '#7C3AED', highlight: true },
  daejeon: { name: '대전', nameEn: 'Daejeon', path: 'M145,165 L160,160 L165,170 L155,180 L140,175 Z', color: '#2563EB' },
  ulsan: { name: '울산', nameEn: 'Ulsan', path: 'M250,215 L265,210 L270,220 L260,230 L245,225 Z', color: '#059669' },
  sejong: { name: '세종', nameEn: 'Sejong', path: 'M140,145 L150,142 L153,150 L145,155 L138,152 Z', color: '#6366F1' },

  // 도
  gyeonggi: { name: '경기', nameEn: 'Gyeonggi', path: 'M105,70 L155,65 L165,100 L160,130 L120,135 L95,110 Z', color: '#10B981' },
  gangwon: { name: '강원', nameEn: 'Gangwon', path: 'M165,55 L235,50 L245,120 L200,145 L165,130 Z', color: '#14B8A6' },
  chungbuk: { name: '충북', nameEn: 'Chungbuk', path: 'M155,125 L195,120 L200,160 L160,175 L150,155 Z', color: '#8B5CF6' },
  chungnam: { name: '충남', nameEn: 'Chungnam', path: 'M85,130 L145,125 L155,175 L100,195 L70,165 Z', color: '#EC4899' },
  jeonbuk: { name: '전북', nameEn: 'Jeonbuk', path: 'M75,195 L140,180 L145,220 L95,235 L65,215 Z', color: '#F59E0B' },
  jeonnam: { name: '전남', nameEn: 'Jeonnam', path: 'M55,235 L130,220 L140,290 L70,310 L40,270 Z', color: '#84CC16', highlight: true },
  gyeongbuk: { name: '경북', nameEn: 'Gyeongbuk', path: 'M195,115 L260,105 L270,195 L215,215 L180,175 Z', color: '#EF4444' },
  gyeongnam: { name: '경남', nameEn: 'Gyeongnam', path: 'M145,220 L230,200 L245,270 L160,295 L130,260 Z', color: '#3B82F6' },
  jeju: { name: '제주', nameEn: 'Jeju', path: 'M80,350 L130,345 L135,370 L85,375 Z', color: '#06B6D4' },
};

export default function KoreaMapSection() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[#2563EB]" />
          <h2 className="text-2xl font-bold text-slate-900">전국 지도</h2>
          <span className="text-sm text-slate-500">Korea Map</span>
        </div>
        <span className="text-sm text-slate-500">
          지역을 클릭하여 해당 지역의 뉴스와 정보를 확인하세요
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 지도 영역 */}
        <div className="lg:col-span-8">
          <div className="relative bg-slate-50 rounded-xl p-6 border border-slate-200">
            <svg
              viewBox="0 0 300 400"
              className="w-full h-auto max-h-[500px]"
              style={{ aspectRatio: '3/4' }}
            >
              {/* 바다 배경 */}
              <rect x="0" y="0" width="300" height="400" fill="#E0F2FE" />

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
                      fill={hoveredRegion === key ? region.color : region.highlight ? region.color : '#E2E8F0'}
                      stroke={region.color}
                      strokeWidth={hoveredRegion === key || region.highlight ? 2 : 1}
                      opacity={hoveredRegion === key || region.highlight ? 1 : 0.8}
                      className="transition-all duration-200"
                    />
                    {/* 지역명 (호버시 또는 하이라이트 지역) */}
                    {(hoveredRegion === key || region.highlight) && (
                      <text
                        x={getRegionCenter(region.path).x}
                        y={getRegionCenter(region.path).y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        className="pointer-events-none drop-shadow"
                      >
                        {region.name}
                      </text>
                    )}
                  </g>
                </Link>
              ))}
            </svg>

            {/* 호버 정보 */}
            {hoveredRegion && REGIONS[hoveredRegion as keyof typeof REGIONS] && (
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: REGIONS[hoveredRegion as keyof typeof REGIONS].color }}
                  />
                  <span className="font-bold text-slate-900">
                    {REGIONS[hoveredRegion as keyof typeof REGIONS].name}
                  </span>
                  <span className="text-sm text-slate-500">
                    {REGIONS[hoveredRegion as keyof typeof REGIONS].nameEn}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  클릭하여 {REGIONS[hoveredRegion as keyof typeof REGIONS].name} 뉴스 보기
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 지역 목록 */}
        <div className="lg:col-span-4">
          <div className="bg-slate-50 rounded-xl p-5 h-full border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">지역 바로가기</h3>

            {/* 광주/전남 하이라이트 */}
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-green-50 rounded-lg border border-purple-200">
              <p className="text-xs text-slate-600 mb-2">🌟 우리 지역</p>
              <div className="flex gap-2">
                <Link
                  href="/region/gwangju"
                  className="flex-1 py-2 px-3 bg-[#7C3AED] text-white text-sm font-medium rounded-lg text-center hover:bg-[#6D28D9] transition-colors"
                >
                  광주
                </Link>
                <Link
                  href="/region/jeonnam"
                  className="flex-1 py-2 px-3 bg-[#84CC16] text-white text-sm font-medium rounded-lg text-center hover:bg-[#65A30D] transition-colors"
                >
                  전남
                </Link>
              </div>
            </div>

            {/* 전체 지역 목록 */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(REGIONS)
                .filter(([key]) => key !== 'gwangju' && key !== 'jeonnam')
                .map(([key, region]) => (
                  <Link
                    key={key}
                    href={`/region/${key}`}
                    className="py-2 px-2 text-sm text-center rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-white transition-all"
                    onMouseEnter={() => setHoveredRegion(key)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    {region.name}
                  </Link>
                ))}
            </div>

            {/* 지사 링크 */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <Link
                href="https://koreanewskorea.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#A6121D] text-white rounded-lg font-medium hover:bg-[#8a0f18] transition-colors"
              >
                <span>📍 광주/전남 지역뉴스</span>
              </Link>
              <p className="text-xs text-slate-500 text-center mt-2">
                IP 기반 자동 지역 감지 적용
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Separation */}
      <div className="w-full h-px bg-slate-200 mt-8" />
    </section>
  );
}

// SVG path에서 중심점 계산하는 헬퍼 함수
function getRegionCenter(path: string): { x: number; y: number } {
  const coords = path.match(/\d+/g)?.map(Number) || [];
  if (coords.length < 2) return { x: 0, y: 0 };

  let sumX = 0, sumY = 0;
  for (let i = 0; i < coords.length; i += 2) {
    sumX += coords[i];
    sumY += coords[i + 1];
  }

  const count = coords.length / 2;
  return { x: sumX / count, y: sumY / count };
}
