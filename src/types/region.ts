/**
 * 지역 페이지 공통 타입 정의
 * 3단계 시군구 페이지에서 재사용
 */

// 뉴스 기사 타입
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  category: string;
  source: string;
  publishedAt: string;
  viewCount: number;
}

// 날씨 데이터 타입
export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherDesc: string;
  };
  daily: {
    tempMin: number;
    tempMax: number;
  };
  airQuality: {
    pm10: number;
    pm25: number;
    grade: string;
  };
  forecast: {
    hourly: { time: string; temp: number; icon: string }[];
  };
}

// 행사 데이터 타입
export interface EventData {
  id: string;
  title: string;
  eventDate: string;
  startDate?: string;
  endDate?: string;
  location: string;
  category: string;
  description?: string;
  imageUrl?: string | null;
  phone?: string | null;
  isFeatured?: boolean;
}

// 장소 데이터 타입
export interface PlaceData {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  category: string;
  rating: number;
  naverMapUrl: string | null;
  kakaoMapUrl: string | null;
}

// 지역 정보 타입
export interface RegionInfo {
  code: string;           // 'naju', 'jindo' 등
  name: string;           // '나주시', '진도군' 등
  nameEn: string;         // 'Naju', 'Jindo' 등
  sido: string;           // '전남', '광주' 등
  slogan: string;         // 지역 슬로건
  sidoSlogan: string;     // 시도 슬로건
  heroImage: string;      // 히어로 이미지 경로
  description: string;    // 지역 설명
  themeColor: string;     // 테마 색상 (emerald, cyan, purple 등)
}

// 뉴스 탭 카테고리 (5단계 정규화)
export type NewsCategory = 'all' | 'government' | 'council' | 'fire' | 'education' | 'business' | 'local';

export interface NewsTab {
  id: NewsCategory;
  label: string;
  emoji: string;
  description: string;
}

// 4단계 시군구 뉴스 탭 정의
export const SIGUNGU_NEWS_TABS: NewsTab[] = [
  { id: 'all', label: '전체', emoji: '📰', description: '모든 소식' },
  { id: 'government', label: '나주시소식', emoji: '🏛️', description: '시군청 보도자료' },
  { id: 'education', label: '교육소식', emoji: '🏫', description: '지역교육지원청 보도자료' },
  { id: 'council', label: '의회소식', emoji: '🗳️', description: '시군의회 보도자료' },
  { id: 'fire', label: '나주소방서', emoji: '🚒', description: '나주소방서 보도자료' },
  { id: 'business', label: '기업소식', emoji: '🏢', description: '기업 보도자료' },
  { id: 'local', label: '오피니언', emoji: '🏘️', description: '오피니언' },
];

// 카테고리별 스타일
export const CATEGORY_STYLES: Record<string, { color: string; emoji: string }> = {
  government: { color: 'bg-cyan-100 text-cyan-600', emoji: '🏛️' },
  council: { color: 'bg-purple-100 text-purple-600', emoji: '🗳️' },
  fire: { color: 'bg-orange-100 text-orange-600', emoji: '🚒' },
  education: { color: 'bg-green-100 text-green-600', emoji: '🏫' },
  business: { color: 'bg-indigo-100 text-indigo-600', emoji: '🏢' },
  local: { color: 'bg-amber-100 text-amber-600', emoji: '🏘️' },
  // Legacy mapping
  '시정': { color: 'bg-cyan-100 text-cyan-600', emoji: '🏛️' },
  '의회': { color: 'bg-purple-100 text-purple-600', emoji: '🗳️' },
  '교육': { color: 'bg-green-100 text-green-600', emoji: '🏫' },
  '행정': { color: 'bg-cyan-100 text-cyan-600', emoji: '🏛️' },
  '안전': { color: 'bg-orange-100 text-orange-600', emoji: '🛡️' },
  '문화': { color: 'bg-pink-100 text-pink-600', emoji: '🎭' },
  '경제': { color: 'bg-blue-100 text-blue-600', emoji: '💰' },
};

// 카테고리 스타일 가져오기
export function getCategoryStyle(category: string): { color: string; emoji: string } {
  return CATEGORY_STYLES[category] || { color: 'bg-gray-100 text-gray-600', emoji: '📰' };
}

// 상대 시간 포맷팅
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', timeZone: 'Asia/Seoul' });
}
