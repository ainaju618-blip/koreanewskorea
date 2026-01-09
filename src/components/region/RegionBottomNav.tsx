'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabType = 'home' | 'news' | 'food' | 'travel' | 'menu';

interface RegionBottomNavProps {
  regionCode: string;
  className?: string;
}

interface NavItem {
  id: TabType;
  icon: string;
  label: string;
  getHref: (regionCode: string) => string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: 'home', label: '홈', getHref: (code) => `/region/${code}` },
  { id: 'news', icon: 'newspaper', label: '뉴스', getHref: (code) => `/region/${code}/news` },
  { id: 'food', icon: 'restaurant', label: '맛집', getHref: (code) => `/region/${code}/food` },
  { id: 'travel', icon: 'travel_explore', label: '여행', getHref: (code) => `/region/${code}/travel` },
  { id: 'menu', icon: 'menu', label: '전체', getHref: (code) => `/region/${code}/menu` },
];

/**
 * 지역 페이지 전용 하단 네비게이션
 * 모바일 전용 (lg 이상에서 숨김)
 * 5탭: 홈, 뉴스, 맛집, 여행, 전체
 */
export default function RegionBottomNav({
  regionCode,
  className = '',
}: RegionBottomNavProps) {
  const pathname = usePathname();

  // 현재 활성 탭 결정
  const getActiveTab = (): TabType => {
    if (pathname.includes('/news')) return 'news';
    if (pathname.includes('/food')) return 'food';
    if (pathname.includes('/travel')) return 'travel';
    if (pathname.includes('/menu')) return 'menu';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1a2230] border-t border-gray-100 dark:border-gray-800 lg:hidden ${className}`}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const href = item.getHref(regionCode);

          return (
            <Link
              key={item.id}
              href={href}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-2 transition-colors ${
                isActive
                  ? 'text-cyan-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
