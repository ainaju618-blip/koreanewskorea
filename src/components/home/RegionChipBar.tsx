'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

/**
 * RegionChipBar - 지역 수평 칩 버튼 바
 * ========================================
 * 17개 시도를 수평 스크롤로 표시
 * 모바일: 터치 스크롤
 * 데스크탑: 화살표 버튼 + 드래그 스크롤
 *
 * WCAG 2.1 AA 준수:
 * - 44px 최소 터치 타겟
 * - 키보드 네비게이션
 * - focus-visible 스타일
 */

interface Region {
  code: string;
  shortName: string;
  color: string;
}

const REGIONS: Region[] = [
  { code: 'seoul', shortName: '서울', color: '#DC2626' },
  { code: 'busan', shortName: '부산', color: '#EA580C' },
  { code: 'daegu', shortName: '대구', color: '#D97706' },
  { code: 'incheon', shortName: '인천', color: '#0891B2' },
  { code: 'gwangju', shortName: '광주', color: '#7C3AED' },
  { code: 'daejeon', shortName: '대전', color: '#2563EB' },
  { code: 'ulsan', shortName: '울산', color: '#059669' },
  { code: 'sejong', shortName: '세종', color: '#6366F1' },
  { code: 'gyeonggi', shortName: '경기', color: '#10B981' },
  { code: 'gangwon', shortName: '강원', color: '#14B8A6' },
  { code: 'chungbuk', shortName: '충북', color: '#8B5CF6' },
  { code: 'chungnam', shortName: '충남', color: '#EC4899' },
  { code: 'jeonbuk', shortName: '전북', color: '#F59E0B' },
  { code: 'jeonnam', shortName: '전남', color: '#84CC16' },
  { code: 'gyeongbuk', shortName: '경북', color: '#EF4444' },
  { code: 'gyeongnam', shortName: '경남', color: '#3B82F6' },
  { code: 'jeju', shortName: '제주', color: '#06B6D4' },
];

interface RegionChipBarProps {
  selectedRegion?: string;
  className?: string;
}

export default function RegionChipBar({ selectedRegion, className }: RegionChipBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // 스크롤 상태 체크
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        scrollEl.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={`relative bg-slate-50 border-y border-slate-200 ${className || ''}`}>
      <div className="w-full max-w-[1400px] mx-auto px-4 relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="이전 지역 보기"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 전국 버튼 */}
          <Link
            href="/"
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              !selectedRegion
                ? 'bg-[#A6121D] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-300 hover:border-[#A6121D] hover:text-[#A6121D]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>전국</span>
          </Link>

          {/* 구분선 */}
          <div className="w-px h-6 bg-slate-300 flex-shrink-0 mx-1" />

          {/* 지역 칩들 */}
          {REGIONS.map((region) => (
            <Link
              key={region.code}
              href={`/region/${region.code}`}
              className={`flex-shrink-0 inline-flex items-center px-4 py-2 min-h-[44px] rounded-full font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                selectedRegion === region.code
                  ? 'text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400 hover:shadow-sm'
              }`}
              style={{
                backgroundColor: selectedRegion === region.code ? region.color : undefined,
              }}
            >
              {region.shortName}
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="다음 지역 보기"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

    </div>
  );
}

// Skeleton for loading state
export function RegionChipBarSkeleton() {
  return (
    <div className="bg-slate-50 border-y border-slate-200">
      <div className="w-full max-w-[1400px] mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-16 h-10 bg-slate-200 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
