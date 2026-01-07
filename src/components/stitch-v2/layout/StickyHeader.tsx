'use client';

import React from 'react';
import Link from 'next/link';

interface StickyHeaderProps {
  title?: string;
  subtitle?: string;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  showBack?: boolean;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onBackClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function StickyHeader({
  title = 'KOREA NEWS',
  subtitle,
  showMenu = true,
  showSearch = true,
  showNotifications = false,
  showProfile = false,
  showBack = false,
  onMenuClick,
  onSearchClick,
  onBackClick,
  className = '',
  children,
}: StickyHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 dark:bg-[#1a2230]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 ${className}`}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Menu or Back */}
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={onBackClick}
              className="p-2 -ml-2 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="뒤로가기"
            >
              <span className="material-symbols-outlined text-[28px]">arrow_back</span>
            </button>
          )}
          {showMenu && !showBack && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="메뉴"
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          )}
        </div>

        {/* Center: Logo/Title */}
        <div className="flex flex-col items-center flex-1">
          <Link href="/">
            <h1 className="text-xl font-bold tracking-tight text-primary leading-none">
              {title}
            </h1>
          </Link>
          {subtitle && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="p-2 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="검색"
            >
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>
          )}
          {showNotifications && (
            <button
              className="p-2 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="알림"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
          )}
          {showProfile && (
            <button
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white overflow-hidden"
              aria-label="프로필"
            >
              <span className="material-symbols-outlined text-[24px]">account_circle</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional children (e.g., category tabs) */}
      {children}
    </header>
  );
}
