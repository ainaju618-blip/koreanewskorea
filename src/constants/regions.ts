/**
 * 전남 지역 코드 상수 정의
 * 
 * 전남 22개 시군 및 광주광역시 정보를 포함합니다.
 * GNB 메가메뉴, 지역 허브 페이지, 기사 필터링에 사용됩니다.
 */

// 지역 타입 정의
export interface Region {
    code: string;       // URL slug 및 DB 필터링용 코드
    name: string;       // 한글 표시명
    type: 'metro' | 'city' | 'county' | 'agency';  // 광역시/시/군/기관 구분
}

// 전남 22개 시군 목록
export const JEONNAM_REGIONS: Region[] = [
    // 시 (5개)
    { code: 'mokpo', name: '목포시', type: 'city' },
    { code: 'yeosu', name: '여수시', type: 'city' },
    { code: 'suncheon', name: '순천시', type: 'city' },
    { code: 'naju', name: '나주시', type: 'city' },
    { code: 'gwangyang', name: '광양시', type: 'city' },

    // 군 (17개)
    { code: 'damyang', name: '담양군', type: 'county' },
    { code: 'gokseong', name: '곡성군', type: 'county' },
    { code: 'gurye', name: '구례군', type: 'county' },
    { code: 'goheung', name: '고흥군', type: 'county' },
    { code: 'boseong', name: '보성군', type: 'county' },
    { code: 'hwasun', name: '화순군', type: 'county' },
    { code: 'jangheung', name: '장흥군', type: 'county' },
    { code: 'gangjin', name: '강진군', type: 'county' },
    { code: 'haenam', name: '해남군', type: 'county' },
    { code: 'yeongam', name: '영암군', type: 'county' },
    { code: 'muan', name: '무안군', type: 'county' },
    { code: 'hampyeong', name: '함평군', type: 'county' },
    { code: 'yeonggwang', name: '영광군', type: 'county' },
    { code: 'jangseong', name: '장성군', type: 'county' },
    { code: 'wando', name: '완도군', type: 'county' },
    { code: 'jindo', name: '진도군', type: 'county' },
    { code: 'sinan', name: '신안군', type: 'county' },
];

// 광주광역시
export const GWANGJU_DISTRICTS: Region[] = [
    { code: 'gwangju', name: '광주광역시', type: 'metro' },
];

// 전라남도 (province level)
export const JEONNAM_PROVINCE: Region[] = [
    { code: 'jeonnam', name: '전라남도', type: 'metro' },
];

// 교육청 (Agencies)
// Note: Supports multiple naming conventions used in DB
// - reporters.region may use: '광주교육청', '광주시교육청'
// - reporters.region may use: '전남교육청', '전라남도교육청'
export const EDUCATION_AGENCIES: Region[] = [
    { code: 'gwangju_edu', name: '광주교육청', type: 'agency' },
    { code: 'jeonnam_edu', name: '전남교육청', type: 'agency' },
    { code: 'jeonnam_edu_org', name: '전남교육청 기관', type: 'agency' },
    { code: 'jeonnam_edu_school', name: '전남교육청 학교', type: 'agency' },
];

// Alternative names mapping (for DB compatibility)
// When querying reporters, also check these alternative names
export const REGION_ALIASES: Record<string, string[]> = {
    '광주교육청': ['광주시교육청', '광주광역시교육청'],
    '전남교육청': ['전라남도교육청'],
};

// 전남 시(city)만 필터링
export const JEONNAM_CITIES = JEONNAM_REGIONS.filter(r => r.type === 'city');

// 전남 군(county)만 필터링
export const JEONNAM_COUNTIES = JEONNAM_REGIONS.filter(r => r.type === 'county');

// 지역 코드로 지역 정보 조회
export function getRegionByCode(code: string): Region | undefined {
    return [...JEONNAM_REGIONS, ...GWANGJU_DISTRICTS, ...JEONNAM_PROVINCE, ...EDUCATION_AGENCIES].find(r => r.code === code);
}

// 지역명으로 지역 정보 조회
export function getRegionByName(name: string): Region | undefined {
    return [...JEONNAM_REGIONS, ...GWANGJU_DISTRICTS, ...JEONNAM_PROVINCE, ...EDUCATION_AGENCIES].find(r => r.name === name);
}

// 모든 지역 통합 목록
export const ALL_REGIONS = [...GWANGJU_DISTRICTS, ...JEONNAM_PROVINCE, ...JEONNAM_REGIONS, ...EDUCATION_AGENCIES];
