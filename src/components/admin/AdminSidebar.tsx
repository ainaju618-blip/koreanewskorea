"use client";

/**
 * AdminSidebar - 관리자 사이드바 레이아웃
 * ========================================
 * - 중앙화된 메뉴 config 사용
 * - 모바일 반응형 (접기/펼치기)
 * - 접근성 개선 (ARIA 속성)
 * - 성능 최적화 (useCallback, React.memo)
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import {
  ADMIN_MENU_CONFIG,
  BADGE_COUNT_ENDPOINTS,
  BADGE_REFRESH_INTERVAL,
  type MenuItem,
  type SubMenuItem,
  type MenuGroup,
} from '@/config/admin-menu';
import { useAdminAuth } from './AdminAuthGuard';

// 배지 카운트 타입
interface BadgeCounts {
  pending: number;
  aiPending: number;
  drafts: number;
}

// 메뉴 아이템 컴포넌트 Props
interface MenuItemComponentProps {
  item: MenuItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  badgeCounts: BadgeCounts;
  onNavigate?: () => void;
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
}: MenuItemComponentProps) {
  const Icon = item.icon;
  const parentBadgeCount = getBadgeCountForItem(item, badgeCounts);

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
          aria-controls={`submenu-${item.id}`}
        >
          <div className="flex items-center gap-2.5">
            <Icon
              className={`w-4 h-4 ${isActive ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`}
              aria-hidden="true"
            />
            <span>{item.label}</span>
            {parentBadgeCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full min-w-[18px] text-center">
                {parentBadgeCount}
              </span>
            )}
          </div>
          <ChevronRight
            className={`w-4 h-4 text-[#6e7681] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* 서브메뉴 */}
        <ul
          id={`submenu-${item.id}`}
          className={`overflow-hidden transition-all duration-200 ${
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
          role="menu"
          aria-label={`${item.label} 서브메뉴`}
        >
          <div className="mt-1 ml-3 space-y-0.5 border-l border-[#30363d] pl-3">
            {item.subItems.map((sub) => {
              const isSubActive = checkSubItemActive(sub.href, pathname);
              const subBadgeCount = getBadgeCountForSubItem(sub, badgeCounts);
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

  // 외부 링크
  if (item.external) {
    return (
      <li>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 min-h-[44px] text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#e6edf3]"
        >
          <Icon className="w-4 h-4 text-[#8b949e]" aria-hidden="true" />
          <span className="flex-1">{item.label}</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#6e7681]" aria-hidden="true" />
        </a>
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
        <Icon
          className={`w-4 h-4 ${pathname === item.href ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`}
          aria-hidden="true"
        />
        <span className="flex-1">{item.label}</span>
        {parentBadgeCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full min-w-[18px] text-center">
            {parentBadgeCount}
          </span>
        )}
      </Link>
    </li>
  );
});

// 유틸리티 함수들
function checkSubItemActive(href: string, pathname: string): boolean {
  if (href.includes('?')) {
    return pathname.startsWith(href.split('?')[0]);
  }
  return pathname === href || pathname.startsWith(href + '/');
}

function getBadgeCountForItem(item: MenuItem, counts: BadgeCounts): number {
  if (item.badge) {
    return counts[item.badge] || 0;
  }
  // 서브메뉴의 배지 합계
  if (item.subItems) {
    return item.subItems.reduce((sum, sub) => {
      if (sub.badge) {
        return sum + (counts[sub.badge] || 0);
      }
      return sum;
    }, 0);
  }
  return 0;
}

function getBadgeCountForSubItem(sub: SubMenuItem, counts: BadgeCounts): number {
  if (sub.badge) {
    return counts[sub.badge] || 0;
  }
  return 0;
}

// 메인 사이드바 컴포넌트
export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, role } = useAdminAuth();

  // 모바일 사이드바 상태
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 확장된 메뉴 상태
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // 기본 확장 메뉴
    return ['manual-articles', 'news-management', 'scraper'];
  });

  // 배지 카운트
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    pending: 0,
    aiPending: 0,
    drafts: 0,
  });

  // 배지 카운트 조회
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const res = await fetch(BADGE_COUNT_ENDPOINTS.pending);
        if (res.ok) {
          const data = await res.json();
          setBadgeCounts((prev) => ({
            ...prev,
            pending: data.count || 0,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, BADGE_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // 메뉴 토글
  const toggleMenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  }, []);

  // 모바일 사이드바 닫기
  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // 모바일에서 링크 클릭 시 사이드바 닫기
  const handleNavigate = useCallback(() => {
    if (window.innerWidth < 1024) {
      closeMobileSidebar();
    }
  }, [closeMobileSidebar]);

  // ESC 키로 모바일 사이드바 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        closeMobileSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, closeMobileSidebar]);

  // 화면 크기 변경 시 모바일 사이드바 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  return (
    <div className="admin-layout flex min-h-screen bg-[#0d1117] text-gray-100 font-sans">
      {/* 모바일 오버레이 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#21262d] border border-[#30363d] text-white hover:bg-[#30363d] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={isMobileOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={isMobileOpen}
        aria-controls="admin-sidebar"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* 사이드바 */}
      <aside
        id="admin-sidebar"
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto
          w-64 bg-[#010409] border-r border-[#21262d] flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="관리자 네비게이션"
      >
        {/* 로고 영역 */}
        <div className="h-16 flex items-stretch border-b border-[#21262d] bg-[#010409]">
          <Link
            href="/admin"
            onClick={handleNavigate}
            className="flex-1 flex items-center px-4 hover:bg-[#161b22] transition-all duration-200 border-r border-[#21262d] group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-black mr-2.5 text-sm shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
              K
            </div>
            <span className="text-sm font-bold text-[#e6edf3] tracking-tight">Korea CMS</span>
          </Link>
          <Link
            href="/idea"
            onClick={handleNavigate}
            className="flex-1 flex items-center px-4 hover:bg-[#161b22] transition-all duration-200 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center text-white mr-2.5 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
              AI Idea
            </span>
          </Link>
        </div>

        {/* 네비게이션 */}
        <nav
          className="flex-1 overflow-y-auto p-3 space-y-5"
          style={{ maxHeight: 'calc(100vh - 64px - 80px)' }}
          aria-label="메인 메뉴"
        >
          {ADMIN_MENU_CONFIG.map((group) => (
            <MenuGroupComponent
              key={group.id}
              group={group}
              pathname={pathname}
              expandedMenus={expandedMenus}
              onToggle={toggleMenu}
              badgeCounts={badgeCounts}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        {/* 푸터 유저 프로필 */}
        <div className="p-3 border-t border-[#21262d] bg-[#010409]">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#1f6feb] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#1f6feb]/20">
              KO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#e6edf3] truncate">Administrator</p>
              <p className="text-[11px] text-[#8b949e] capitalize">{role || 'Admin'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-[#6e7681] hover:text-[#f85149] hover:bg-[#21262d] transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-h-screen bg-[#0d1117] lg:ml-0">
        {/* 모바일 헤더 스페이서 */}
        <div className="h-16 lg:hidden" />
        <div className="p-4 lg:p-6 pb-12 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// 메뉴 그룹 컴포넌트
const MenuGroupComponent = memo(function MenuGroupComponent({
  group,
  pathname,
  expandedMenus,
  onToggle,
  badgeCounts,
  onNavigate,
}: {
  group: MenuGroup;
  pathname: string;
  expandedMenus: string[];
  onToggle: (id: string) => void;
  badgeCounts: BadgeCounts;
  onNavigate?: () => void;
}) {
  return (
    <div role="group" aria-labelledby={`group-${group.id}`}>
      {group.category && (
        <div
          id={`group-${group.id}`}
          className="px-3 mb-2 text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest"
        >
          {group.category}
        </div>
      )}
      <ul className="space-y-0.5" role="menu">
        {group.items.map((item) => {
          const isActive =
            pathname === item.href ||
            item.subItems?.some((sub) => checkSubItemActive(sub.href, pathname));
          const isExpanded = expandedMenus.includes(item.id);

          return (
            <MenuItemComponent
              key={item.id}
              item={item}
              isActive={isActive || false}
              isExpanded={isExpanded}
              onToggle={() => onToggle(item.id)}
              pathname={pathname}
              badgeCounts={badgeCounts}
              onNavigate={onNavigate}
            />
          );
        })}
      </ul>
    </div>
  );
});
