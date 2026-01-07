'use client';

import React from 'react';
import Link from 'next/link';

type HeaderVariant = 'national' | 'city';

interface HeaderProps {
  variant: HeaderVariant;
  cityName?: string;
  regionName?: string;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

export default function Header({
  variant,
  cityName,
  regionName,
  showMenu = true,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  onProfileClick,
  className = '',
}: HeaderProps) {
  const isNational = variant === 'national';

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 dark:bg-[#1a2230]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 ${className}`}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Menu */}
        <div className="flex items-center">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          )}
        </div>

        {/* Center: Logo/Title */}
        <div className="flex flex-col items-center flex-1">
          {isNational ? (
            <>
              <Link href="/">
                <h1 className="text-xl font-bold tracking-tight text-primary leading-none">
                  KOREA NEWS
                </h1>
              </Link>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase mt-0.5">
                National Edition
              </span>
            </>
          ) : (
            <>
              <Link href={regionName ? `/region/${regionName}` : '/'}>
                <h1 className="text-lg font-bold tracking-tight text-primary leading-none">
                  Korea NEWS {cityName}
                </h1>
              </Link>
              {regionName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-gray-500 dark:text-gray-400">
                    location_on
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {regionName}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="p-2 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Search"
            >
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>
          )}
          {showNotifications && (
            <button
              onClick={onNotificationsClick}
              className="p-2 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
          )}
          {showProfile && (
            <button
              onClick={onProfileClick}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white overflow-hidden"
              aria-label="Profile"
            >
              <span className="material-symbols-outlined text-[24px]">account_circle</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
