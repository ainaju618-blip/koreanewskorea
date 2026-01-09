/**
 * 관리자 대시보드 타입 정의
 * =========================
 */

// 봇 로그 타입
export interface BotLog {
  id: string;
  region: string;
  status: 'success' | 'running' | 'failed' | 'error';
  articles_count: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

// 대시보드 통계
export interface DashboardStats {
  pending: number;
  today: number;
  views: number;
  totalArticles: number;
  logs: BotLog[];
}

// 지역 통계
export interface RegionStat {
  source: string;
  name: string;
  count: number;
  type: 'government' | 'metro' | 'province' | 'education' | 'local';
}

// 테스트 설정
export interface TestConfig {
  enabled: boolean;
  lastResult?: {
    timestamp: string;
    successRegions: number;
    totalRegions: number;
    failedRegions: string[];
  };
}

// 서비스 사용량
export interface ServiceUsage {
  cloudinary?: {
    storage: {
      used: number;
      limit: number;
    };
    bandwidth?: {
      used: number;
      limit: number;
    };
  };
  supabase?: {
    database: {
      used: number;
      limit: number;
    };
    storage?: {
      used: number;
      limit: number;
    };
  };
}

// 테스트 진행 상태
export interface TestProgress {
  current: number;
  total: number;
  currentRegion: string;
}

// 지역 정보 상수
export const ALL_REGIONS = {
  government: [
    { source: 'korea', name: '정부(korea.kr)' }
  ],
  metro: [
    { source: 'seoul', name: '서울특별시' },
    { source: 'busan', name: '부산광역시' },
    { source: 'daegu', name: '대구광역시' },
    { source: 'incheon', name: '인천광역시' },
    { source: 'gwangju', name: '광주광역시' },
    { source: 'daejeon', name: '대전광역시' },
    { source: 'ulsan', name: '울산광역시' },
    { source: 'sejong', name: '세종특별자치시' }
  ],
  province: [
    { source: 'gyeonggi', name: '경기도' },
    { source: 'gangwon', name: '강원특별자치도' },
    { source: 'chungbuk', name: '충청북도' },
    { source: 'chungnam', name: '충청남도' },
    { source: 'jeonbuk', name: '전북특별자치도' },
    { source: 'jeonnam', name: '전라남도' },
    { source: 'gyeongbuk', name: '경상북도' },
    { source: 'gyeongnam', name: '경상남도' },
    { source: 'jeju', name: '제주특별자치도' }
  ]
} as const;

// 지역 이름 맵
export const REGION_NAMES: Record<string, string> = (() => {
  const names: Record<string, string> = {};
  [...ALL_REGIONS.government, ...ALL_REGIONS.metro, ...ALL_REGIONS.province].forEach(r => {
    names[r.source] = r.name;
  });
  return names;
})();

// 색상 스키마
export const DASHBOARD_COLORS = {
  cyan: { bg: 'from-cyan-600 to-cyan-500', shadow: 'shadow-cyan-500/30', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  purple: { bg: 'from-purple-600 to-purple-500', shadow: 'shadow-purple-500/30', text: 'text-purple-400', border: 'border-purple-500/30' },
  amber: { bg: 'from-amber-600 to-amber-500', shadow: 'shadow-amber-500/30', text: 'text-amber-400', border: 'border-amber-500/30' },
  emerald: { bg: 'from-emerald-600 to-emerald-500', shadow: 'shadow-emerald-500/30', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  yellow: { bg: 'from-yellow-600 to-yellow-500', shadow: 'shadow-yellow-500/30', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  slate: { bg: 'from-slate-600 to-slate-500', shadow: 'shadow-slate-500/30', text: 'text-slate-400', border: 'border-slate-500/30' },
} as const;

export type DashboardColorKey = keyof typeof DASHBOARD_COLORS;
