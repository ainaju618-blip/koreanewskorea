// Location-based news regions data (전국판)
// 17개 시·도 + 정부 보도자료

export interface RegionInfo {
    name: string;
    type: 'metro' | 'province' | 'government';
}

export const REGIONS: Record<string, RegionInfo> = {
    // 정부 보도자료
    korea: { name: '정부(korea.kr)', type: 'government' },

    // 특별시·광역시·특별자치시 (8개)
    seoul: { name: '서울특별시', type: 'metro' },
    busan: { name: '부산광역시', type: 'metro' },
    daegu: { name: '대구광역시', type: 'metro' },
    incheon: { name: '인천광역시', type: 'metro' },
    gwangju: { name: '광주광역시', type: 'metro' },
    daejeon: { name: '대전광역시', type: 'metro' },
    ulsan: { name: '울산광역시', type: 'metro' },
    sejong: { name: '세종특별자치시', type: 'metro' },

    // 도·특별자치도 (9개)
    gyeonggi: { name: '경기도', type: 'province' },
    gangwon: { name: '강원특별자치도', type: 'province' },
    chungbuk: { name: '충청북도', type: 'province' },
    chungnam: { name: '충청남도', type: 'province' },
    jeonbuk: { name: '전북특별자치도', type: 'province' },
    jeonnam: { name: '전라남도', type: 'province' },
    gyeongbuk: { name: '경상북도', type: 'province' },
    gyeongnam: { name: '경상남도', type: 'province' },
    jeju: { name: '제주특별자치도', type: 'province' },
} as const;

export type RegionCode = keyof typeof REGIONS;

// Get all region codes
export function getRegionCodes(): RegionCode[] {
    return Object.keys(REGIONS) as RegionCode[];
}

// Get region name by code
export function getRegionName(code: RegionCode): string {
    return REGIONS[code]?.name || code;
}

// Get regions grouped by type
export function getRegionsByType(): {
    government: RegionCode[];
    metro: RegionCode[];
    province: RegionCode[];
} {
    const result = {
        government: [] as RegionCode[],
        metro: [] as RegionCode[],
        province: [] as RegionCode[]
    };

    for (const [code, info] of Object.entries(REGIONS)) {
        result[info.type].push(code as RegionCode);
    }

    return result;
}

// Validate if a string is a valid region code
export function isValidRegionCode(code: string): code is RegionCode {
    return code in REGIONS;
}

// 레거시 호환용 (city, county → 제거됨)
// 전국판에서는 metro와 province만 사용
