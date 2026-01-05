/**
 * 전국 지역 데이터 유틸리티 함수
 * koreanewskorea.com 전국판 라우팅 시스템
 *
 * 기존 regions.ts (광주/전남 권한 체계)와 분리된 전국 17개 시/도 지원
 */

import regionsData from '../data/regions.json';

// ============================================
// Types
// ============================================

export interface District {
  code: string;
  name: string;
  isSingleDistrict?: boolean;
  mergedWith?: string[];
  isPrimary?: boolean;
}

export interface Region {
  code: string;
  name: string;
  shortName: string;
  type: 'metropolitan' | 'special' | 'province' | 'special-province';
  order: number;
  districts: District[];
}

export interface SpecialRule {
  description: string;
  merged: boolean;
  primaryRegion: string;
  includedRegions: string[];
}

export interface RegionsData {
  version: string;
  lastUpdated: string;
  description: string;
  specialRules: Record<string, SpecialRule>;
  regions: Region[];
}

export interface RegionOption {
  value: string;
  label: string;
  type: 'sido' | 'sigungu';
  parent?: string;
}

export interface RegionBreadcrumb {
  code: string;
  name: string;
  href: string;
  isActive: boolean;
}

export interface DetectedLocation {
  sido: string;
  sidoName: string;
  sigungu?: string;
  sigunguName?: string;
  confidence: number;
  source: 'ip' | 'gps' | 'manual' | 'cookie';
}

// ============================================
// Data Access
// ============================================

const data = regionsData as RegionsData;

/**
 * 모든 시/도 목록 조회
 */
export function getAllRegions(): Region[] {
  return data.regions.sort((a, b) => a.order - b.order);
}

/**
 * 시/도 코드로 지역 정보 조회
 */
export function getRegionByCode(sidoCode: string): Region | undefined {
  return data.regions.find((r) => r.code === sidoCode);
}

/**
 * 시/도 이름으로 지역 정보 조회
 */
export function getRegionByName(sidoName: string): Region | undefined {
  return data.regions.find(
    (r) => r.name === sidoName || r.shortName === sidoName
  );
}

/**
 * 시/군/구 코드로 상세 지역 정보 조회
 */
export function getDistrictByCode(
  sidoCode: string,
  sigunguCode: string
): District | undefined {
  const region = getRegionByCode(sidoCode);
  return region?.districts.find((d) => d.code === sigunguCode);
}

/**
 * 시/군/구 이름으로 상세 지역 정보 조회
 */
export function getDistrictByName(
  sidoCode: string,
  sigunguName: string
): District | undefined {
  const region = getRegionByCode(sidoCode);
  return region?.districts.find((d) => d.name === sigunguName);
}

/**
 * 특정 시/도의 모든 시/군/구 조회
 */
export function getDistrictsByRegion(sidoCode: string): District[] {
  const region = getRegionByCode(sidoCode);
  return region?.districts || [];
}

// ============================================
// Special Rules (목포+신안 통합)
// ============================================

/**
 * 목포+신안 통합 규칙 확인
 */
export function isMergedRegion(sigunguCode: string): boolean {
  const rule = data.specialRules.mokpo_sinan;
  return rule?.includedRegions.includes(sigunguCode) ?? false;
}

/**
 * 통합 지역의 주요 지역 코드 반환
 */
export function getPrimaryRegion(sigunguCode: string): string {
  if (isMergedRegion(sigunguCode)) {
    return data.specialRules.mokpo_sinan.primaryRegion;
  }
  return sigunguCode;
}

// ============================================
// URL & Navigation
// ============================================

/**
 * 지역 URL 경로 생성
 */
export function buildRegionPath(
  sidoCode: string,
  sigunguCode?: string,
  articleId?: string
): string {
  let path = `/region/${sidoCode}`;
  if (sigunguCode) {
    const actualCode = getPrimaryRegion(sigunguCode);
    path += `/${actualCode}`;
  }
  if (articleId) {
    path += `/${articleId}`;
  }
  return path;
}

/**
 * 브레드크럼 생성
 */
export function buildBreadcrumbs(
  sidoCode?: string,
  sigunguCode?: string
): RegionBreadcrumb[] {
  const breadcrumbs: RegionBreadcrumb[] = [
    { code: 'home', name: '홈', href: '/', isActive: false },
    { code: 'region', name: '지역뉴스', href: '/region', isActive: !sidoCode },
  ];

  if (sidoCode) {
    const region = getRegionByCode(sidoCode);
    if (region) {
      breadcrumbs.push({
        code: region.code,
        name: region.name,
        href: buildRegionPath(sidoCode),
        isActive: !sigunguCode,
      });

      if (sigunguCode) {
        const district = getDistrictByCode(sidoCode, sigunguCode);
        if (district) {
          breadcrumbs.push({
            code: district.code,
            name: district.name,
            href: buildRegionPath(sidoCode, sigunguCode),
            isActive: true,
          });
        }
      }
    }
  }

  return breadcrumbs;
}

// ============================================
// Dropdown Options
// ============================================

/**
 * 시/도 드롭다운 옵션 생성
 */
export function getRegionOptions(): RegionOption[] {
  return data.regions.map((r) => ({
    value: r.code,
    label: r.name,
    type: 'sido' as const,
  }));
}

/**
 * 시/군/구 드롭다운 옵션 생성
 */
export function getDistrictOptions(sidoCode: string): RegionOption[] {
  const region = getRegionByCode(sidoCode);
  if (!region) return [];

  return region.districts
    .filter((d) => d.isPrimary !== false)
    .map((d) => ({
      value: d.code,
      label: d.name,
      type: 'sigungu' as const,
      parent: sidoCode,
    }));
}

// ============================================
// Validation
// ============================================

/**
 * 지역 코드 유효성 검증
 */
export function isValidRegion(sidoCode: string): boolean {
  return !!getRegionByCode(sidoCode);
}

/**
 * 시/군/구 코드 유효성 검증
 */
export function isValidDistrict(sidoCode: string, sigunguCode: string): boolean {
  return !!getDistrictByCode(sidoCode, sigunguCode);
}

/**
 * 전체 시/군/구 코드로 시/도 찾기
 */
export function findRegionByDistrictCode(sigunguCode: string): Region | undefined {
  return data.regions.find((r) =>
    r.districts.some((d) => d.code === sigunguCode)
  );
}

// ============================================
// Search
// ============================================

/**
 * 지역 검색 (자동완성용)
 */
export function searchRegions(query: string): RegionOption[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: RegionOption[] = [];

  data.regions.forEach((region) => {
    if (
      region.name.includes(query) ||
      region.shortName.includes(query) ||
      region.code.includes(normalizedQuery)
    ) {
      results.push({
        value: region.code,
        label: region.name,
        type: 'sido',
      });
    }

    region.districts.forEach((district) => {
      if (
        district.name.includes(query) ||
        district.code.includes(normalizedQuery)
      ) {
        results.push({
          value: district.code,
          label: `${region.shortName} ${district.name}`,
          type: 'sigungu',
          parent: region.code,
        });
      }
    });
  });

  return results.slice(0, 10);
}

// ============================================
// Location Detection Integration
// ============================================

/**
 * IP 기반 위치 감지 결과를 지역 코드로 변환
 */
export function normalizeDetectedLocation(
  location: Partial<DetectedLocation>
): DetectedLocation | null {
  if (!location.sido) return null;

  const region = getRegionByCode(location.sido);
  if (!region) return null;

  const result: DetectedLocation = {
    sido: region.code,
    sidoName: region.name,
    confidence: location.confidence ?? 0.5,
    source: location.source ?? 'ip',
  };

  if (location.sigungu) {
    const district = getDistrictByCode(location.sido, location.sigungu);
    if (district) {
      result.sigungu = district.code;
      result.sigunguName = district.name;
    }
  }

  return result;
}

// ============================================
// Statistics Placeholder
// ============================================

/**
 * 시/도별 뉴스 수 통계용 placeholder
 */
export function getRegionStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  data.regions.forEach((r) => {
    stats[r.code] = 0;
  });
  return stats;
}

// ============================================
// Region Type Helpers
// ============================================

/**
 * 광역시/특별시 목록
 */
export function getMetropolitanRegions(): Region[] {
  return data.regions.filter(
    (r) => r.type === 'metropolitan' || r.type === 'special'
  );
}

/**
 * 도 목록
 */
export function getProvinces(): Region[] {
  return data.regions.filter(
    (r) => r.type === 'province' || r.type === 'special-province'
  );
}

/**
 * 지역 타입 한글 라벨
 */
export function getRegionTypeLabel(
  type: Region['type']
): string {
  const labels: Record<Region['type'], string> = {
    metropolitan: '광역시',
    special: '특별자치시',
    province: '도',
    'special-province': '특별자치도',
  };
  return labels[type] || type;
}
