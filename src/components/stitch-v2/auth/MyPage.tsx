'use client';

import React from 'react';
import Link from 'next/link';

// ============================================
// Types
// ============================================
interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface UserStats {
  scraps: number;
  comments: number;
  likes: number;
}

interface MenuItem {
  icon: string;
  label: string;
  href: string;
  iconBgClass?: string;
  iconColorClass?: string;
}

interface MyPageProps {
  user?: UserProfile;
  stats?: UserStats;
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
}

// ============================================
// Sub Components
// ============================================

// Header Component
function Header({
  onMenuClick,
  onSettingsClick,
}: {
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-800 px-4 py-3 justify-between shadow-sm border-b border-gray-100 dark:border-gray-800">
      <button
        aria-label="Menu"
        className="flex size-10 items-center justify-center text-[#111418] dark:text-white"
        onClick={onMenuClick}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
          menu
        </span>
      </button>
      <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
        MY
      </h2>
      <button
        aria-label="Settings"
        className="flex size-10 items-center justify-center text-[#111418] dark:text-white"
        onClick={onSettingsClick}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
          settings
        </span>
      </button>
    </header>
  );
}

// Profile Section Component
function ProfileSection({
  user,
  onEditProfile,
}: {
  user: UserProfile;
  onEditProfile?: () => void;
}) {
  const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-full h-16 w-16 border-2 border-gray-100 dark:border-gray-700"
            style={{
              backgroundImage: user.avatarUrl
                ? `url("${user.avatarUrl}")`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          <div className="flex flex-col justify-center">
            <p className="text-[#111418] dark:text-white text-[20px] font-bold leading-tight">
              {user.name}
            </p>
            <p className="text-[#60708a] dark:text-gray-400 text-sm font-normal leading-normal">
              {maskedEmail}
            </p>
          </div>
        </div>
      </div>
      <button
        className="flex w-full cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        onClick={onEditProfile}
      >
        <span className="truncate">프로필 수정</span>
      </button>
    </section>
  );
}

// Stats Section Component
function StatsSection({ stats }: { stats: UserStats }) {
  const statItems = [
    { icon: 'bookmark', value: stats.scraps, label: '스크랩' },
    { icon: 'chat_bubble', value: stats.comments, label: '댓글' },
    { icon: 'thumb_up', value: stats.likes, label: '좋아요' },
  ];

  return (
    <section className="grid grid-cols-3 gap-3">
      {statItems.map((item) => (
        <div
          key={item.icon}
          className="flex flex-col gap-1 rounded-xl bg-white dark:bg-slate-800 p-4 items-center text-center shadow-sm"
        >
          <span
            className="material-symbols-outlined text-primary mb-1"
            style={{ fontSize: 24 }}
          >
            {item.icon}
          </span>
          <p className="text-[#111418] dark:text-white text-xl font-bold leading-tight">
            {item.value}
          </p>
          <p className="text-[#60708a] dark:text-gray-400 text-xs font-medium">
            {item.label}
          </p>
        </div>
      ))}
    </section>
  );
}

// Menu List Item Component
function MenuListItem({ item }: { item: MenuItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 text-left"
    >
      <div
        className={`flex items-center justify-center rounded-lg shrink-0 size-9 ${
          item.iconBgClass || 'bg-gray-100 dark:bg-gray-800'
        } ${item.iconColorClass || 'text-[#111418] dark:text-gray-200'}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {item.icon}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-[#111418] dark:text-white text-[15px] font-medium leading-normal">
          {item.label}
        </p>
      </div>
      <span
        className="material-symbols-outlined text-gray-400"
        style={{ fontSize: 20 }}
      >
        chevron_right
      </span>
    </Link>
  );
}

// Menu Group Component
function MenuGroup({ items }: { items: MenuItem[] }) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-sm">
      {items.map((item) => (
        <MenuListItem key={item.label} item={item} />
      ))}
    </section>
  );
}

// Bottom Navigation Component
function BottomNavigation() {
  const navItems = [
    { icon: 'home', label: '홈', href: '/', active: false },
    { icon: 'search', label: '검색', href: '/search', active: false },
    { icon: 'newspaper', label: '뉴스', href: '/news', active: false },
    { icon: 'person', label: 'MY', href: '/my', active: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.icon}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors gap-1 ${
              item.active
                ? 'text-primary'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 24,
                fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {item.icon}
            </span>
            <span
              className={`text-[10px] ${item.active ? 'font-bold' : 'font-medium'}`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export default function MyPage({
  user = {
    name: '사용자',
    email: 'user@example.com',
  },
  stats = {
    scraps: 0,
    comments: 0,
    likes: 0,
  },
  onMenuClick,
  onSettingsClick,
  onEditProfile,
  onLogout,
}: MyPageProps) {
  // Activity menu items
  const activityMenuItems: MenuItem[] = [
    {
      icon: 'bookmark_border',
      label: '내 스크랩',
      href: '/my/scraps',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/20',
      iconColorClass: 'text-primary',
    },
    {
      icon: 'chat',
      label: '내 댓글',
      href: '/my/comments',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/20',
      iconColorClass: 'text-primary',
    },
    {
      icon: 'favorite_border',
      label: '좋아요한 기사',
      href: '/my/likes',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/20',
      iconColorClass: 'text-primary',
    },
  ];

  // Settings menu items
  const settingsMenuItems: MenuItem[] = [
    {
      icon: 'notifications',
      label: '알림 설정',
      href: '/my/notifications',
    },
    {
      icon: 'location_on',
      label: '관심 지역 설정',
      href: '/my/regions',
    },
    {
      icon: 'category',
      label: '관심 카테고리',
      href: '/my/categories',
    },
  ];

  // Support menu items
  const supportMenuItems: MenuItem[] = [
    {
      icon: 'settings_applications',
      label: '앱 설정',
      href: '/my/settings',
    },
    {
      icon: 'headset_mic',
      label: '고객센터',
      href: '/support',
    },
    {
      icon: 'description',
      label: '이용약관',
      href: '/terms',
    },
  ];

  return (
    <div className="bg-gray-100 dark:bg-[#101722] text-[#111418] dark:text-white overflow-x-hidden min-h-screen pb-20">
      <Header onMenuClick={onMenuClick} onSettingsClick={onSettingsClick} />

      <main className="flex flex-col gap-4 p-4">
        {/* Profile Section */}
        <ProfileSection user={user} onEditProfile={onEditProfile} />

        {/* Stats Section */}
        <StatsSection stats={stats} />

        {/* Menu Group 1: Activity */}
        <MenuGroup items={activityMenuItems} />

        {/* Menu Group 2: Settings */}
        <MenuGroup items={settingsMenuItems} />

        {/* Menu Group 3: Support */}
        <MenuGroup items={supportMenuItems} />

        {/* Footer Actions */}
        <div className="mt-4 flex flex-col items-center gap-4 mb-20">
          <button
            className="w-full rounded-xl bg-white dark:bg-slate-800 py-4 text-center text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm"
            onClick={onLogout}
          >
            로그아웃
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            앱 버전 v1.0.0
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

// ============================================
// Exports
// ============================================
export { Header, ProfileSection, StatsSection, MenuGroup, BottomNavigation };
export type { UserProfile, UserStats, MenuItem, MyPageProps };
