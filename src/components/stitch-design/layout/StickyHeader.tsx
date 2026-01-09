'use client';

import Link from 'next/link';
import { useState } from 'react';

interface StickyHeaderProps {
  variant?: 'national' | 'regional';
  regionName?: string;
  regionLocation?: string;
  showUtilityBar?: boolean;
  breakingNews?: string;
}

const categories = [
  { id: 'all', label: '종합' },
  { id: 'politics', label: '정치/행정' },
  { id: 'economy', label: '경제/농업' },
  { id: 'education', label: '교육/복지' },
  { id: 'travel', label: '여행/축제' },
  { id: 'opinion', label: '오피니언' },
];

export default function StickyHeader({
  variant = 'national',
  regionName = '나주',
  regionLocation = '전라남도 나주시',
  showUtilityBar = true,
  breakingNews = '전국 농작물 수확량 보고서 발표, 귀농 지원 확대 논의...',
}: StickyHeaderProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  // 오늘 날짜 (한국 시간)
  const today = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '.').replace('.', '');

  if (variant === 'regional') {
    return (
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-[#101722] p-4 border-b border-gray-100 dark:border-gray-800 justify-between">
        <button className="flex size-10 shrink-0 items-center justify-center cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="material-symbols-outlined text-[#111418] dark:text-white text-[24px]">menu</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">
            코리아뉴스 {regionName}판
          </h2>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[12px] filled">location_on</span>
            <span className="text-xs text-gray-500 font-medium">{regionLocation}</span>
          </div>
        </div>
        <div className="flex w-10 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-full size-10 hover:bg-gray-100 dark:hover:bg-gray-800">
            <span className="material-symbols-outlined text-[#111418] dark:text-white text-[24px]">account_circle</span>
          </button>
        </div>
      </header>
    );
  }

  // National variant (전국판)
  return (
    <>
      {/* Utility Bar (Date & Breaking News) */}
      {showUtilityBar && (
        <div className="bg-slate-100 dark:bg-slate-800 text-xs font-medium border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center px-4 py-2 gap-3 max-w-md mx-auto w-full">
            <span className="text-primary font-bold whitespace-nowrap">{today}</span>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-1.5 overflow-hidden text-gray-900 dark:text-slate-200">
              <span className="material-symbols-outlined text-red-500 text-[16px] animate-pulse">emergency_home</span>
              <p className="truncate">{breakingNews}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-md mx-auto w-full">
          <div className="flex justify-between items-center px-4 py-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <button className="text-gray-900 dark:text-white p-1 -ml-1">
                <span className="material-symbols-outlined text-[28px]">menu</span>
              </button>
              <Link href="/" className="flex flex-col leading-none">
                <span className="text-primary font-black text-xl tracking-tighter">KOREA NEWS</span>
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">National Edition</span>
              </Link>
            </div>

            {/* Action Icons */}
            <div className="flex gap-1">
              <button className="p-2 text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <span className="material-symbols-outlined">search</span>
              </button>
              <button className="p-2 text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
              </button>
              <button className="p-2 text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <span className="material-symbols-outlined">account_circle</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-6 min-w-max pb-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative flex flex-col items-center justify-center text-sm transition-colors ${
                    activeCategory === cat.id
                      ? 'text-gray-900 dark:text-white font-bold'
                      : 'text-gray-500 dark:text-slate-400 font-medium hover:text-primary'
                  }`}
                >
                  <span>{cat.label}</span>
                  {activeCategory === cat.id && (
                    <span className="absolute -bottom-3 w-full h-[3px] bg-gray-900 dark:bg-white rounded-t-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
