/**
 * 전국 지역 데이터 정의 (koreanewskorea 전국판)
 * 스크래퍼와 DB 관리에서 공통으로 사용
 *
 * 2026-01-06 확정: 4개 봇만 활성화
 */

export interface Region {
    id: string;       // 영문 코드 (스크래퍼용)
    label: string;    // 한글명 (DB source 값 및 UI 표시용)
    type?: 'metro' | 'province' | 'government' | 'local';  // 분류
}

// ============================================
// 활성화된 스크래퍼 (4개만\!)
// ============================================

// 활성화된 시·군 단위 스크래퍼 (2026-01-06 확정)
export const activeLocalScrapers: Region[] = [
    { id: "naju", label: "나주시청", type: "local" },
    { id: "naju_council", label: "나주시의회", type: "local" },
    { id: "jindo", label: "진도군청", type: "local" },
    { id: "jindo_council", label: "진도군의회", type: "local" },
];

// ============================================
// 비활성화됨 - 전국 17개 시·도 (참고용만)
// ============================================

// 특별시·광역시·특별자치시 (8개) - 비활성화
export const metroRegions: Region[] = [
    { id: "seoul", label: "서울특별시", type: "metro" },
    { id: "busan", label: "부산광역시", type: "metro" },
    { id: "daegu", label: "대구광역시", type: "metro" },
    { id: "incheon", label: "인천광역시", type: "metro" },
    { id: "gwangju", label: "광주광역시", type: "metro" },
    { id: "daejeon", label: "대전광역시", type: "metro" },
    { id: "ulsan", label: "울산광역시", type: "metro" },
    { id: "sejong", label: "세종특별자치시", type: "metro" },
];

// 도·특별자치도 (9개) - 비활성화
export const provinceRegions: Region[] = [
    { id: "gyeonggi", label: "경기도", type: "province" },
    { id: "gangwon", label: "강원특별자치도", type: "province" },
    { id: "chungbuk", label: "충청북도", type: "province" },
    { id: "chungnam", label: "충청남도", type: "province" },
    { id: "jeonbuk", label: "전북특별자치도", type: "province" },
    { id: "jeonnam", label: "전라남도", type: "province" },
    { id: "gyeongbuk", label: "경상북도", type: "province" },
    { id: "gyeongnam", label: "경상남도", type: "province" },
    { id: "jeju", label: "제주특별자치도", type: "province" },
];

// 정부 보도자료 - 비활성화
export const governmentRegions: Region[] = [
    { id: "korea", label: "정부(korea.kr)", type: "government" },
];

// ============================================
// 통합 목록
// ============================================

// 활성화된 스크래퍼만 (실제 사용)
export const allRegions: Region[] = [...activeLocalScrapers];

// 지자체만 (레거시 호환)
export const localRegions: Region[] = [...activeLocalScrapers];

// ============================================
// 매핑 헬퍼
// ============================================

// ID → Label 매핑 (빠른 조회용)
export const regionIdToLabel: Record<string, string> = Object.fromEntries(
    allRegions.map(r => [r.id, r.label])
);

// Label → ID 매핑 (DB source → 스크래퍼 ID 변환용)
export const regionLabelToId: Record<string, string> = Object.fromEntries(
    allRegions.map(r => [r.label, r.id])
);

/**
 * 지역 ID로 라벨 가져오기
 */
export function getRegionLabel(id: string): string {
    return regionIdToLabel[id] || id;
}

/**
 * 지역 라벨로 ID 가져오기
 */
export function getRegionId(label: string): string | undefined {
    return regionLabelToId[label];
}

// ============================================
// 스크래퍼 상태
// ============================================

/**
 * 활성화된 스크래퍼 ID 목록 (2026-01-06 확정: 4개만\!)
 */
export const availableScraperIds: string[] = [
    "naju",
    "naju_council",
    "jindo",
    "jindo_council",
];

/**
 * 스크래퍼가 있는 지역인지 확인
 */
export function hasScraperAvailable(id: string): boolean {
    return availableScraperIds.includes(id);
}

/**
 * 지역 타입별 그룹 가져오기
 */
export function getRegionsByType(type: Region['type']): Region[] {
    return allRegions.filter(r => r.type === type);
}

// ============================================
// 레거시 호환 (기존 코드 지원)
// ============================================

// 기존 agencyRegions 참조하는 코드 호환용 (빈 배열)
export const agencyRegions: Region[] = [];
