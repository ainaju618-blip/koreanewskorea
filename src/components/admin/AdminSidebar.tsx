"use client";

/**
 * AdminSidebar - 나주시 전용 관리자 사이드바
 * ==========================================
 * - 단순화된 메뉴 (10개)
 * - 모바일 반응형
 * - 복제 용이한 구조
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Menu, X } from 'lucide-react';
import {
  ADMIN_MENU_CONFIG,
  BADGE_COUNT_ENDPOINTS,
  BADGE_REFRESH_INTERVAL,
  REGION_CONFIG,
  type MenuItem,
  type SubMenuItem,
  type MenuGroup,
} from '@/config/admin-menu';

// 배지 카운트 타입
interface BadgeCounts {
  pending: number;
  drafts: number;
}

// 서브메뉴 아이템 컴포넌트
const SubMenuItemComponent = memo(function SubMenuItemComponent({
  sub,
  isActive,
  badgeCount,
  onNavigate,
}: {
  sub: SubMenuItem;
  isActive: boolean;
  badgeCount: number;
  onNavigate?: () => void;
}) {
  const SubIcon = sub.icon;

  return (
    <li>
      <Link
        href={sub.href}
        onClick={onNavigate}
        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 w-full min-h-[40px]
          ${isActive
            ? 'text-[#58a6ff] font-semibold bg-[#1f6feb]/10'
            : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
          }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {SubIcon && (
          <SubIcon
            className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#58a6ff]' : 'text-[#6e7681]'}`}
            aria-hidden="true"
          />
        )}
        <span className="flex-1 truncate">{sub.label}</span>
        {badgeCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full min-w-[18px] text-center">
            {badgeCount}
          </span>
        )}
      </Link>
    </li>
  );
});

// 메뉴 아이템 컴포넌트
const MenuItemComponent = memo(function MenuItemComponent({
  item,
  isActive,
  isExpanded,
  onToggle,
  pathname,
  badgeCounts,
  onNavigate,
}: {
  item: MenuItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  badgeCounts: BadgeCounts;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const badgeCount = item.badge ? badgeCounts[item.badge] || 0 : 0;

  // 서브메뉴가 있는 경우
  if (item.subItems && item.subItems.length > 0) {
    return (
      <li>
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 min-h-[44px]
            ${isActive ? 'bg-[#1f6feb]/15 text-[#58a6ff]' : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#e6edf3]'}
          `}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2.5">
            <Icon className={`w-4 h-4 ${isActive ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
            <span>{item.label}</span>
            {badgeCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full">
                {badgeCount}
              </span>
            )}
          </div>
          <ChevronRight className={`w-4 h-4 text-[#6e7681] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <ul className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mt-1 ml-3 space-y-0.5 border-l border-[#30363d] pl-3">
            {item.subItems.map((sub) => {
              const isSubActive = sub.href.includes('?')
                ? pathname.startsWith(sub.href.split('?')[0])
                : pathname === sub.href;
              const subBadgeCount = sub.badge ? badgeCounts[sub.badge] || 0 : 0;
              return (
                <SubMenuItemComponent
                  key={sub.id}
                  sub={sub}
                  isActive={isSubActive}
                  badgeCount={subBadgeCount}
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        </ul>
      </li>
    );
  }

  // 단일 메뉴 아이템
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 min-h-[44px]
          ${pathname === item.href
            ? 'bg-[#1f6feb]/15 text-[#58a6ff]'
            : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#e6edf3]'
          }`}
        aria-current={pathname === item.href ? 'page' : undefined}
      >
        <Icon className={`w-4 h-4 ${pathname === item.href ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
        <span className="flex-1">{item.label}</span>
        {badgeCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full">
            {badgeCount}
          </span>
        )}
      </Link>
    </li>
  );
});

// 메인 사이드바 컴포넌트
export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['news']);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({ pending: 0, drafts: 0 });

  // 배지 카운트 조회
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const res = await fetch(BADGE_COUNT_ENDPOINTS.pending);
        if (res.ok) {
          const data = await res.json();
          setBadgeCounts((prev) => ({ ...prev, pending: data.count || 0 }));
        }
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, BADGE_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  }, []);

  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  const handleNavigate = useCallback(() => {
    if (window.innerWidth < 1024) closeMobileSidebar();
  }, [closeMobileSidebar]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE', credentials: 'include' });
    } finally {
      router.push('/');
    }
  }, [router]);

  // ESC 키로 모바일 사이드바 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) closeMobileSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, closeMobileSidebar]);

  return (
    <div className="admin-layout flex min-h-screen bg-[#0d1117] text-gray-100">
      {/* 모바일 오버레이 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#21262d] border border-[#30363d] text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={isMobileOpen ? '메뉴 닫기' : '메뉴 열기'}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* 사이드바 */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto
          w-60 bg-[#010409] border-r border-[#21262d] flex flex-col
          transform transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 로고 영역 */}
        <div className="h-14 flex items-center px-4 border-b border-[#21262d]">
          <Link href="/admin" onClick={handleNavigate} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {REGION_CONFIG.name.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-bold text-white">{REGION_CONFIG.name}</span>
              <span className="text-[10px] text-[#8b949e] block">Admin</span>
            </div>
          </Link>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {ADMIN_MENU_CONFIG.map((group) => (
            <div key={group.id}>
              <div className="px-3 mb-2 text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">
                {group.category}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    item.subItems?.some((sub) => pathname.startsWith(sub.href.split('?')[0]));
                  const isExpanded = expandedMenus.includes(item.id);

                  return (
                    <MenuItemComponent
                      key={item.id}
                      item={item}
                      isActive={isActive || false}
                      isExpanded={isExpanded}
                      onToggle={() => toggleMenu(item.id)}
                      pathname={pathname}
                      badgeCounts={badgeCounts}
                      onNavigate={handleNavigate}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* 푸터 */}
        <div className="p-3 border-t border-[#21262d]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-h-screen bg-[#0d1117]">
        <div className="h-14 lg:hidden" />
        <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
