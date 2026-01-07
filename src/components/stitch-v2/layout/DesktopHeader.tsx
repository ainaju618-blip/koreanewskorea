'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface DesktopHeaderProps {
  /** Site title displayed next to the logo */
  title?: string;
  /** Navigation items for GNB */
  navItems?: NavItem[];
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** User profile image URL */
  profileImageUrl?: string;
  /** Whether to show notification badge */
  hasNotifications?: boolean;
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
  /** Callback when notification button is clicked */
  onNotificationsClick?: () => void;
  /** Callback when profile button is clicked */
  onProfileClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: 'Home', href: '/', isActive: true },
  { label: 'Politics', href: '/category/politics' },
  { label: 'Economy', href: '/category/economy' },
  { label: 'Society', href: '/category/society' },
  { label: 'Culture', href: '/category/culture' },
  { label: 'Sports', href: '/category/sports' },
  { label: 'Tech', href: '/category/tech' },
  { label: 'World', href: '/category/world' },
];

export default function DesktopHeader({
  title = 'National Edition',
  navItems = defaultNavItems,
  searchPlaceholder = 'Search',
  profileImageUrl,
  hasNotifications = true,
  onSearch,
  onNotificationsClick,
  onProfileClick,
  className = '',
}: DesktopHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header
      className={`bg-[#fafafa] dark:bg-[#1a2230] pt-4 pb-2 ${className}`}
    >
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        {/* Top Row: Logo, Search, User Actions */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mb-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="size-10 bg-primary text-white rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">newspaper</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111418] dark:text-white">
              {title}
            </h1>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl w-full mx-auto"
          >
            <div className="relative flex items-center w-full h-11 rounded-xl bg-[#f0f2f5] dark:bg-gray-800">
              <div className="grid place-items-center h-full w-12 text-gray-400">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="peer h-full w-full outline-none bg-transparent text-sm text-[#111418] dark:text-white placeholder:text-gray-400"
                placeholder={searchPlaceholder}
              />
            </div>
          </form>

          {/* User Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Notifications */}
            <button
              onClick={onNotificationsClick}
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[24px] text-[#111418] dark:text-white">
                notifications
              </span>
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={onProfileClick}
              className="size-10 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={
                profileImageUrl
                  ? { backgroundImage: `url('${profileImageUrl}')` }
                  : undefined
              }
              aria-label="Profile"
            >
              {!profileImageUrl && (
                <span className="material-symbols-outlined text-[28px] text-gray-400">
                  account_circle
                </span>
              )}
            </button>
          </div>
        </div>

        {/* GNB Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 font-medium whitespace-nowrap transition-colors ${
                item.isActive
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-[#60708a] dark:text-gray-400 hover:text-[#111418] dark:hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
