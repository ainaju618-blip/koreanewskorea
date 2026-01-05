/**
 * 지역 데이터 타입 정의
 * koreanewskorea.com 전국판 라우팅 시스템
 */

// 시/군/구 타입
export interface District {
  code: string;
  name: string;
  isSingleDistrict?: boolean;  // 세종시처럼 단일 행정구역
  mergedWith?: string[];        // 목포+신안 통합 케이스
  isPrimary?: boolean;          // 통합 시 주요 지역 여부
}

// 시/도 타입
export interface Region {
  code: string;
  name: string;
  shortName: string;
  type: 'metropolitan' | 'special' | 'province' | 'special-province';
  order: number;
  districts: District[];
}

// 특수 규칙 타입 (목포+신안 통합 등)
export interface SpecialRule {
  description: string;
  merged: boolean;
  primaryRegion: string;
  includedRegions: string[];
}

// 전체 지역 데이터 타입
export interface RegionsData {
  version: string;
  lastUpdated: string;
  description: string;
  specialRules: Record<string, SpecialRule>;
  regions: Region[];
}

// 라우팅 파라미터 타입
export interface RegionRouteParams {
  sido: string;
  sigungu?: string;
  articleId?: string;
}

// 위치 감지 결과 타입
export interface DetectedLocation {
  sido: string;
  sidoName: string;
  sigungu?: string;
  sigunguName?: string;
  confidence: number;
  source: 'ip' | 'gps' | 'manual' | 'cookie';
}

// 지역 선택 옵션 타입 (드롭다운용)
export interface RegionOption {
  value: string;
  label: string;
  type: 'sido' | 'sigungu';
  parent?: string;
}

// 지역 브레드크럼 타입
export interface RegionBreadcrumb {
  code: string;
  name: string;
  href: string;
  isActive: boolean;
}
