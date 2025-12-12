/**
 * 지역 데이터 정의
 * 스크래퍼와 DB 관리에서 공통으로 사용
 */

export interface Region {
    id: string;       // 영문 코드 (스크래퍼용)
    label: string;    // 한글명 (DB source 값 및 UI 표시용)
}

// 지자체 목록 (24개)
export const localRegions: Region[] = [
    { id: "gwangju", label: "광주광역시" },
    { id: "jeonnam", label: "전라남도" },
    { id: "naju", label: "나주시" },
    { id: "mokpo", label: "목포시" },
    { id: "yeosu", label: "여수시" },
    { id: "suncheon", label: "순천시" },
    { id: "gwangyang", label: "광양시" },
    { id: "damyang", label: "담양군" },
    { id: "gokseong", label: "곡성군" },
    { id: "gurye", label: "구례군" },
    { id: "goheung", label: "고흥군" },
    { id: "boseong", label: "보성군" },
    { id: "hwasun", label: "화순군" },
    { id: "jangheung", label: "장흥군" },
    { id: "gangjin", label: "강진군" },
    { id: "haenam", label: "해남군" },
    { id: "yeongam", label: "영암군" },
    { id: "muan", label: "무안군" },
    { id: "hampyeong", label: "함평군" },
    { id: "yeonggwang", label: "영광군" },
    { id: "jangseong", label: "장성군" },
    { id: "wando", label: "완도군" },
    { id: "jindo", label: "진도군" },
    { id: "shinan", label: "신안군" },
];

// 교육기관 목록 (2개)
export const agencyRegions: Region[] = [
    { id: "gwangju_edu", label: "광주광역시교육청" },
    { id: "jeonnam_edu", label: "전라남도교육청" },
];

// 전체 지역 목록
export const allRegions: Region[] = [...localRegions, ...agencyRegions];

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

/**
 * 스크래퍼가 실제로 구현된 지역 ID 목록
 * (scrapers/{region}/{region}_scraper.py가 존재하는 지역)
 */
export const availableScraperIds: string[] = [
    "damyang",
    "gangjin",
    "gokseong",
    "gwangju",
    "gwangju_edu",
    "jeonnam",
    "jeonnam_edu",
    "mokpo",
    "naju",
    "suncheon",
    "yeonggwang",
    "yeosu",
];

/**
 * 스크래퍼가 있는 지역인지 확인
 */
export function hasScraperAvailable(id: string): boolean {
    return availableScraperIds.includes(id);
}
