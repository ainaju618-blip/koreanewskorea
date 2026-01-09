/**
 * 관리자 메뉴 설정 (나주시 전용 샘플 모델)
 * ========================================
 * 다른 지역 확장 시: 이 파일 복사 후 지역명만 변경
 *
 * 핵심 메뉴만 유지 (51개 → 10개)
 */

import {
  LayoutDashboard,
  Newspaper,
  Bot,
  Users,
  Settings,
  FileText,
  CheckCircle,
  Trash2,
  PenTool,
  PlayCircle,
  Activity,
  UserPlus,
  LucideIcon,
  Sparkles,
} from 'lucide-react';

// 지역 설정 (다른 지역 복제 시 여기만 수정)
export const REGION_CONFIG = {
  code: 'naju',
  name: '나주시',
  fullName: '전라남도 나주시',
  scrapers: ['naju', 'naju_council'], // 활성 스크래퍼
} as const;

// 권한 레벨
export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

// 메뉴 타입
export interface SubMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: 'pending' | 'drafts';
}

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: 'pending' | 'drafts';
  subItems?: SubMenuItem[];
}

export interface MenuGroup {
  id: string;
  category: string;
  items: MenuItem[];
}

// 배지 새로고침 설정
export const BADGE_COUNT_ENDPOINTS = {
  pending: '/api/posts?status=draft&limit=1',
  drafts: '/api/admin/drafts?limit=1',
} as const;

export const BADGE_REFRESH_INTERVAL = 30000;

/**
 * 나주시 전용 Admin 메뉴 (핵심 10개)
 * ===================================
 *
 * 구조:
 * 1. 대시보드 (1개)
 * 2. 콘텐츠 - 기사관리 통합 (3개)
 * 3. 수집 - 스크래퍼 (2개)
 * 4. 시스템 - 사용자/설정 (4개)
 */
export const ADMIN_MENU_CONFIG: MenuGroup[] = [
  {
    id: 'main',
    category: '메인',
    items: [
      {
        id: 'dashboard',
        label: '대시보드',
        icon: LayoutDashboard,
        href: '/admin',
      },
    ],
  },
  {
    id: 'contents',
    category: '콘텐츠',
    items: [
      {
        id: 'news',
        label: '기사 관리',
        icon: Newspaper,
        href: '/admin/news',
        badge: 'pending',
        subItems: [
          { id: 'news-all', label: '전체 기사', href: '/admin/news', icon: Newspaper },
          { id: 'news-pending', label: '승인 대기', href: '/admin/news?status=draft', icon: FileText, badge: 'pending' },
          { id: 'news-published', label: '발행됨', href: '/admin/news?status=published', icon: CheckCircle },
          { id: 'news-trash', label: '휴지통', href: '/admin/news?status=trash', icon: Trash2 },
        ],
      },
      {
        id: 'write',
        label: '기사 작성',
        icon: PenTool,
        href: '/admin/news/write',
      },
      {
        id: 'ai-news',
        label: 'AI 뉴스',
        icon: Sparkles,
        href: '/admin/ai-news',
      },
    ],
  },
  {
    id: 'scraper',
    category: '수집',
    items: [
      {
        id: 'bot-run',
        label: '수동 수집',
        icon: PlayCircle,
        href: '/admin/bot/run',
      },
      {
        id: 'bot-logs',
        label: '수집 로그',
        icon: Activity,
        href: '/admin/bot/logs',
      },
    ],
  },
  {
    id: 'system',
    category: '시스템',
    items: [
      {
        id: 'reporters',
        label: '기자 관리',
        icon: UserPlus,
        href: '/admin/users/reporters',
      },
      {
        id: 'members',
        label: '회원 관리',
        icon: Users,
        href: '/admin/users/members',
      },
      {
        id: 'settings',
        label: '설정',
        icon: Settings,
        href: '/admin/settings',
      },
    ],
  },
];

// 대시보드 Quick Actions (나주시 전용)
export const DASHBOARD_QUICK_ACTIONS = [
  { id: 'run-bot', href: '/admin/bot/run', icon: Bot, label: '수집 실행', color: 'cyan' },
  { id: 'write', href: '/admin/news/write', icon: PenTool, label: '기사 작성', color: 'purple' },
  { id: 'pending', href: '/admin/news?status=draft', icon: FileText, label: '승인 대기', color: 'amber', badge: 'pending' },
  { id: 'settings', href: '/admin/settings', icon: Settings, label: '설정', color: 'slate' },
] as const;

// 유틸리티 함수
export function findMenuByPath(pathname: string): { group: MenuGroup; item: MenuItem; subItem?: SubMenuItem } | null {
  for (const group of ADMIN_MENU_CONFIG) {
    for (const item of group.items) {
      if (item.href === pathname) {
        return { group, item };
      }
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (subItem.href === pathname || pathname.startsWith(subItem.href.split('?')[0])) {
            return { group, item, subItem };
          }
        }
      }
    }
  }
  return null;
}
