'use client';

import React from 'react';
import Link from 'next/link';

type TabType = 'home' | 'region' | 'add' | 'bookmark' | 'menu';

interface BottomNavProps {
  activeTab: TabType;
  onAddClick?: () => void;
  className?: string;
}

interface NavItem {
  id: TabType;
  icon: string;
  label: string;
  href: string;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', icon: 'home', label: 'Home', href: '/' },
  { id: 'region', icon: 'location_on', label: 'My Region', href: '/region' },
  { id: 'add', icon: 'add', label: 'Add', href: '#', isFab: true },
  { id: 'bookmark', icon: 'bookmark', label: 'Scrap', href: '/bookmarks' },
  { id: 'menu', icon: 'menu', label: 'All', href: '/menu' },
];

export default function BottomNav({
  activeTab,
  onAddClick,
  className = '',
}: BottomNavProps) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1a2230] border-t border-gray-100 dark:border-gray-800 ${className}`}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2 pb-safe relative">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          // FAB style for center add button
          if (item.isFab) {
            return (
              <button
                key={item.id}
                onClick={onAddClick}
                className="absolute left-1/2 -translate-x-1/2 -top-6 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
                aria-label={item.label}
              >
                <span className="material-symbols-outlined text-[28px]">
                  {item.icon}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 transition-colors ${
                isActive
                  ? 'text-primary'
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
