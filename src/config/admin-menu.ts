/**
 * 관리자 메뉴 중앙 설정 파일
 * ============================
 * 모든 관리자 메뉴를 한 곳에서 관리
 * 권한별 필터링, 동적 메뉴 지원
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
  Calendar,
  PlayCircle,
  Activity,
  Database,
  UserPlus,
  Building2,
  StickyNote,
  UserCircle,
  LucideIcon,
  Lightbulb,
  ExternalLink,
  Sparkles,
  Globe,
  Mail,
  GitBranch,
  Cpu,
  Radio,
  Wrench,
  HardDrive,
} from 'lucide-react';

// 권한 레벨 정의
export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

// 서브메뉴 아이템 타입
export interface SubMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: 'pending' | 'aiPending' | 'drafts'; // 동적 배지 타입
  requiredRole?: AdminRole;
}

// 메뉴 아이템 타입
export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  highlight?: boolean;
  external?: boolean;
  badge?: 'pending' | 'aiPending' | 'drafts';
  subItems?: SubMenuItem[];
  requiredRole?: AdminRole;
}

// 메뉴 그룹 타입
export interface MenuGroup {
  id: string;
  category: string;
  items: MenuItem[];
}

// 배지 카운트 API 경로
export const BADGE_COUNT_ENDPOINTS = {
  pending: '/api/posts?status=draft&limit=1',
  aiPending: '/api/ai-news?status=draft&limit=1',
  drafts: '/api/admin/drafts?limit=1',
} as const;

// 배지 새로고침 간격 (ms)
export const BADGE_REFRESH_INTERVAL = 30000;

// 관리자 메뉴 구조
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
        id: 'manual-articles',
        label: '수동 기사',
        icon: PenTool,
        href: '/admin/articles',
        highlight: true,
        subItems: [
          { id: 'articles-list', label: '기사 목록', href: '/admin/articles', icon: FileText },
          { id: 'articles-new', label: '새 기사 작성', href: '/admin/articles/new', icon: PenTool },
        ],
      },
      {
        id: 'news-management',
        label: '기사 관리',
        icon: Newspaper,
        href: '/admin/news',
        badge: 'pending',
        subItems: [
          { id: 'news-all', label: '전체 기사', href: '/admin/news', icon: Newspaper },
          { id: 'news-drafts', label: '기사 초안', href: '/admin/drafts', icon: StickyNote, badge: 'drafts' },
          { id: 'news-pending', label: '승인 대기', href: '/admin/news?status=draft', icon: FileText, badge: 'pending' },
          { id: 'news-published', label: '발행됨', href: '/admin/news?status=published', icon: CheckCircle },
          { id: 'news-trash', label: '휴지통', href: '/admin/news?status=trash', icon: Trash2 },
          { id: 'news-write', label: '기사 작성', href: '/admin/news/write', icon: PenTool },
        ],
      },
      {
        id: 'ai-news',
        label: 'AI 뉴스',
        icon: Sparkles,
        href: '/admin/ai-news',
        badge: 'aiPending',
        subItems: [
          { id: 'ai-news-edit', label: 'AI 뉴스 편집', href: '/admin/ai-news', icon: Globe },
          { id: 'ai-news-pending', label: '승인 대기', href: '/admin/ai-news?status=draft', icon: FileText, badge: 'aiPending' },
          { id: 'ai-news-published', label: '발행됨', href: '/admin/ai-news?status=published', icon: CheckCircle },
        ],
      },
    ],
  },
  {
    id: 'collection',
    category: '수집 시스템',
    items: [
      {
        id: 'scraper',
        label: '스크래퍼',
        icon: Bot,
        href: '/admin/bot',
        highlight: true,
        subItems: [
          { id: 'scraper-sources', label: '수집처 관리', href: '/admin/sources', icon: Building2 },
          { id: 'scraper-schedule', label: '스케줄 설정', href: '/admin/bot/schedule', icon: Calendar },
          { id: 'scraper-run', label: '수동 실행', href: '/admin/bot/run', icon: PlayCircle },
          { id: 'scraper-ai', label: 'AI 기사 처리', href: '/admin/bot/ai-processing', icon: Cpu },
          { id: 'scraper-logs', label: '수집 로그', href: '/admin/bot/logs', icon: Activity },
          { id: 'scraper-sources-manage', label: '소스 관리', href: '/admin/bot/sources', icon: Database },
          { id: 'scraper-monitor', label: '실시간 모니터링', href: '/admin/bot/realtime-monitor', icon: Radio },
        ],
      },
      {
        id: 'email-extract',
        label: '이메일 수집',
        icon: Mail,
        href: '/admin/email-extract',
      },
    ],
  },
  {
    id: 'ai-tools',
    category: 'AI 도구',
    items: [
      {
        id: 'claude-hub',
        label: 'Claude Hub',
        icon: Database,
        href: '/admin/claude-hub',
        highlight: true,
      },
      {
        id: 'ai-idea',
        label: 'AI Idea',
        icon: Lightbulb,
        href: '/idea',
      },
    ],
  },
  {
    id: 'system',
    category: '시스템',
    items: [
      {
        id: 'users',
        label: '사용자 관리',
        icon: Users,
        href: '/admin/users',
        requiredRole: 'admin',
        subItems: [
          { id: 'users-reporters', label: '기자 관리', href: '/admin/users/reporters', icon: UserPlus },
          { id: 'users-members', label: '회원 관리', href: '/admin/users/members', icon: Users },
          { id: 'users-roles', label: '권한 설정', href: '/admin/users/roles', icon: Settings, requiredRole: 'super_admin' },
        ],
      },
      {
        id: 'git-status',
        label: '깃 관리',
        icon: GitBranch,
        href: '/admin/git-status',
        requiredRole: 'super_admin',
      },
      {
        id: 'monitor',
        label: '서비스 모니터링',
        icon: HardDrive,
        href: '/admin/monitor',
      },
      {
        id: 'settings',
        label: '설정',
        icon: Settings,
        href: '/admin/settings',
        subItems: [
          { id: 'settings-ai', label: 'AI 재가공 설정', href: '/admin/settings/ai', icon: Sparkles },
          { id: 'settings-general', label: '사이트 정보', href: '/admin/settings/general' },
          { id: 'settings-categories', label: '카테고리', href: '/admin/settings/categories' },
          { id: 'settings-layouts', label: '레이아웃', href: '/admin/settings/layouts' },
          { id: 'settings-hero', label: '히어로 슬라이더', href: '/admin/settings/hero-slider' },
          { id: 'settings-api', label: 'API 키', href: '/admin/settings/api', requiredRole: 'super_admin' },
          { id: 'settings-performance', label: 'PageSpeed', href: '/admin/settings/performance', icon: Activity },
        ],
      },
    ],
  },
  {
    id: 'shortcuts',
    category: '바로가기',
    items: [
      {
        id: 'reporter-page',
        label: '기자 페이지',
        icon: UserCircle,
        href: '/reporter',
      },
      {
        id: 'claude-usage',
        label: '클로드 사용량',
        icon: ExternalLink,
        href: 'https://claude.ai/settings/usage',
        external: true,
      },
    ],
  },
];

// 대시보드 Quick Actions 설정
export const DASHBOARD_QUICK_ACTIONS = [
  { id: 'run-bot', href: '/admin/bot/run', icon: Bot, label: '봇 실행', color: 'cyan' },
  { id: 'write-article', href: '/admin/news/write', icon: PenTool, label: '기사 작성', color: 'purple' },
  { id: 'pending', href: '/admin/news?status=draft', icon: FileText, label: '승인 대기', color: 'amber', badge: 'pending' },
  { id: 'ai-ideas', href: '/idea', icon: Lightbulb, label: 'AI 아이디어', color: 'yellow' },
  { id: 'settings', href: '/admin/settings', icon: Settings, label: '설정', color: 'slate' },
] as const;

// 대시보드 Quick Navigation 설정
export const DASHBOARD_QUICK_NAV = [
  { href: '/admin/news', icon: FileText, label: '기사 관리' },
  { href: '/admin/bot/run', icon: Bot, label: '스크래퍼 관리' },
  { href: '/idea', icon: Lightbulb, label: 'AI 아이디어' },
  { href: '/admin/users', icon: Users, label: '사용자 관리' },
  { href: '/', icon: LayoutDashboard, label: '사이트 보기', external: true },
] as const;

/**
 * 권한에 따라 메뉴 필터링
 */
export function filterMenuByRole(menu: MenuGroup[], userRole: AdminRole): MenuGroup[] {
  const roleHierarchy: Record<AdminRole, number> = {
    super_admin: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
  };

  const userLevel = roleHierarchy[userRole];

  return menu
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if (!item.requiredRole) return true;
          return roleHierarchy[item.requiredRole] <= userLevel;
        })
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter((sub) => {
            if (!sub.requiredRole) return true;
            return roleHierarchy[sub.requiredRole] <= userLevel;
          }),
        })),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * 메뉴 ID로 메뉴 아이템 찾기
 */
export function findMenuById(menuId: string): MenuItem | SubMenuItem | null {
  for (const group of ADMIN_MENU_CONFIG) {
    for (const item of group.items) {
      if (item.id === menuId) return item;
      if (item.subItems) {
        const subItem = item.subItems.find((sub) => sub.id === menuId);
        if (subItem) return subItem;
      }
    }
  }
  return null;
}

/**
 * 현재 경로에 해당하는 메뉴 찾기
 */
export function findMenuByPath(pathname: string): { group: MenuGroup; item: MenuItem; subItem?: SubMenuItem } | null {
  for (const group of ADMIN_MENU_CONFIG) {
    for (const item of group.items) {
      if (item.href === pathname) {
        return { group, item };
      }
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (subItem.href === pathname || pathname.startsWith(subItem.href + '/')) {
            return { group, item, subItem };
          }
        }
      }
    }
  }
  return null;
}
