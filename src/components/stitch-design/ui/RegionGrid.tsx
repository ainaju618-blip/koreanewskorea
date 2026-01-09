'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Region {
  id: string;
  label: string;
  href: string;
}

interface RegionGridProps {
  currentRegion?: string;
  currentLocation?: string;
}

const regions: Region[] = [
  { id: 'gyeonggi', label: '경기/인천', href: '/region/gyeonggi' },
  { id: 'seoul', label: '서울', href: '/region/seoul' },
  { id: 'gangwon', label: '강원', href: '/region/gangwon' },
  { id: 'chungnam', label: '충남', href: '/region/chungnam' },
  { id: 'sejong', label: '세종/대전', href: '/region/sejong' },
  { id: 'chungbuk', label: '충북', href: '/region/chungbuk' },
  { id: 'jeonbuk', label: '전북', href: '/region/jeonbuk' },
  { id: 'gwangju', label: '광주/전남', href: '/region/gwangju' },
  { id: 'gyeongbuk', label: '경북/대구', href: '/region/gyeongbuk' },
  { id: 'gyeongnam', label: '경남/부산/울산', href: '/region/gyeongnam' },
  { id: 'jeju', label: '제주', href: '/region/jeju' },
];

export default function RegionGrid({
  currentRegion = 'seoul',
  currentLocation = '서울 종로구',
}: RegionGridProps) {
  const [selectedRegion, setSelectedRegion] = useState(currentRegion);

  return (
    <section className="bg-slate-50 dark:bg-slate-800/50 py-8 px-4 mt-2">
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">public</span>
            지역 선택
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            거주하시는 지역의 소식을 확인하세요
          </p>
        </div>
        <Link
          href="/regions"
          className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
        >
          전체보기
        </Link>
      </div>

      {/* Map Visualization */}
      <div className="relative w-full aspect-[4/3] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3c83f6_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Current Location Indicator */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-500 tracking-wider">
            Current Location
          </span>
          <div className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            <span className="text-sm font-bold">{currentLocation}</span>
          </div>
        </div>

        {/* Region Buttons Grid */}
        <div className="absolute inset-0 flex items-center justify-center pt-8">
          <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
            {regions.slice(0, 3).map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`rounded-lg py-2 text-sm font-bold shadow-sm transition-all ${
                  selectedRegion === region.id
                    ? 'bg-primary text-white border border-primary shadow-lg shadow-primary/20 transform scale-105 z-10'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary text-gray-500'
                }`}
              >
                {region.label}
              </button>
            ))}
            {regions.slice(3, 6).map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`rounded-lg py-2 text-sm font-bold shadow-sm transition-all ${
                  selectedRegion === region.id
                    ? 'bg-primary text-white border border-primary shadow-lg shadow-primary/20 transform scale-105 z-10'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary text-gray-500'
                }`}
              >
                {region.label}
              </button>
            ))}
            {regions.slice(6, 9).map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`rounded-lg py-2 text-sm font-bold shadow-sm transition-all ${
                  selectedRegion === region.id
                    ? 'bg-primary text-white border border-primary shadow-lg shadow-primary/20 transform scale-105 z-10'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary text-gray-500'
                }`}
              >
                {region.label}
              </button>
            ))}
            {/* 경남/부산/울산 - 2열 차지 */}
            <button
              onClick={() => setSelectedRegion('gyeongnam')}
              className={`col-start-2 col-span-2 rounded-lg py-2 text-sm font-bold shadow-sm transition-all ${
                selectedRegion === 'gyeongnam'
                  ? 'bg-primary text-white border border-primary shadow-lg shadow-primary/20 transform scale-105 z-10'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary text-gray-500'
              }`}
            >
              경남/부산/울산
            </button>
            {/* 제주 */}
            <button
              onClick={() => setSelectedRegion('jeju')}
              className={`col-start-1 rounded-lg py-2 text-sm font-bold shadow-sm transition-all ${
                selectedRegion === 'jeju'
                  ? 'bg-primary text-white border border-primary shadow-lg shadow-primary/20 transform scale-105 z-10'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary text-gray-500'
              }`}
            >
              제주
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
