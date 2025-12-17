// Reporter Portal v2.0 Types

export interface Reporter {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  region: string;
  bio?: string;
  avatar_icon?: string;
  profile_image?: string;
  access_level: number;
  status: string;
  type: 'Human' | 'AI Bot';
}

export interface Notification {
  id: string;
  recipient_id?: string;
  type: 'article_approved' | 'article_rejected' | 'article_assigned' | 'article_edited' | 'mention' | 'system';
  title: string;
  message: string | null;
  article_id?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: 'article_created' | 'article_saved' | 'article_submitted' | 'article_approved' | 'article_published' | 'article_rejected';
  entity_type: 'article' | 'press_release' | 'profile';
  entity_id?: string;
  entity_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PressRelease {
  id: string;
  title: string;
  source: string;
  content_preview?: string;
  region: string;
  received_at: string;
  is_read: boolean;
  status: 'new' | 'viewed' | 'converted';
  original_link?: string;
  converted_article_id?: string;
}

export interface DashboardStats {
  myRegionArticles: number;
  myArticles: number;
  publishedArticles: number;
  pendingArticles: number;
  todayViews?: number;
  unreadPressReleases?: number;
  unreadNotifications?: number;
}

export type ViewState = 'dashboard' | 'articles' | 'write' | 'inbox' | 'analytics' | 'profile' | 'notifications' | 'drafts';

// Position labels mapping
export const POSITION_LABELS: Record<string, string> = {
  editor_in_chief: "Editor-in-Chief",
  branch_manager: "Branch Manager",
  editor_chief: "Managing Editor",
  news_chief: "News Chief",
  senior_reporter: "Senior Reporter",
  reporter: "Reporter",
  intern_reporter: "Intern Reporter",
  citizen_reporter: "Citizen Reporter",
  opinion_writer: "Opinion Writer",
  advisor: "Advisor",
  consultant: "Consultant",
  ambassador: "Ambassador",
  seoul_correspondent: "Seoul Correspondent",
  foreign_correspondent: "Foreign Correspondent",
};

// Get Korean position label
export function getPositionLabel(position: string): string {
  const positions: Record<string, string> = {
    editor_in_chief: "주필",
    branch_manager: "지사장",
    editor_chief: "편집국장",
    news_chief: "취재부장",
    senior_reporter: "수석기자",
    reporter: "기자",
    intern_reporter: "수습기자",
    citizen_reporter: "시민기자",
    opinion_writer: "오피니언",
    advisor: "고문",
    consultant: "자문위원",
    ambassador: "홍보대사",
    seoul_correspondent: "서울특파원",
    foreign_correspondent: "해외특파원",
  };
  return positions[position] || position;
}

// Get time-based greeting
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후에요";
  return "좋은 저녁이에요";
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}
