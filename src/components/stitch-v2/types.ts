// Stitch Design System v2 - Type Definitions

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  category?: string;
  categoryId?: string;
  source?: string;
  author?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  date?: string;
  readTime?: string;
  tags?: string[];
  viewCount?: number;
  commentCount?: number;
  likeCount?: number;
}

export interface Category {
  id: string;
  label: string;
  slug?: string;
  icon?: string;
}

export interface Region {
  code: string;
  name: string;
  nameEn?: string;
  type: 'metro' | 'province' | 'city' | 'county' | 'district';
  parentCode?: string;
  accentColor?: string;
  population?: number;
}

export interface NavItem {
  icon: string;
  filledIcon?: string;
  label: string;
  href: string;
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinDate?: string;
}

export interface UserStats {
  scrappedCount: number;
  commentCount: number;
  likeCount: number;
  daysSinceJoin?: number;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  location?: string;
}

export interface SearchResult {
  query: string;
  totalCount: number;
  items: NewsArticle[];
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
}

// Color palette by region
export const REGION_COLORS: Record<string, string> = {
  seoul: '#0033A0',
  busan: '#00A0E0',
  daegu: '#ED1C24',
  incheon: '#005BAC',
  gwangju: '#00A651',
  daejeon: '#0072BC',
  ulsan: '#00B4E7',
  sejong: '#00A19C',
  gyeonggi: '#003DA5',
  gangwon: '#009944',
  chungbuk: '#E60012',
  chungnam: '#0066B3',
  jeonbuk: '#006838',
  jeonnam: '#009A44',
  gyeongbuk: '#00479D',
  gyeongnam: '#0054A6',
  jeju: '#FF6600',
};

// Default categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', label: '전체', slug: '' },
  { id: 'politics', label: '정치', slug: 'politics' },
  { id: 'economy', label: '경제', slug: 'economy' },
  { id: 'society', label: '사회', slug: 'society' },
  { id: 'culture', label: '문화', slug: 'culture' },
  { id: 'opinion', label: '오피니언', slug: 'opinion' },
];

// Default navigation items
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { icon: 'home', filledIcon: 'home', label: '홈', href: '/' },
  { icon: 'explore', filledIcon: 'explore', label: '탐색', href: '/explore' },
  { icon: 'bookmark_border', filledIcon: 'bookmark', label: '스크랩', href: '/bookmarks' },
  { icon: 'person_outline', filledIcon: 'person', label: 'MY', href: '/my' },
];
