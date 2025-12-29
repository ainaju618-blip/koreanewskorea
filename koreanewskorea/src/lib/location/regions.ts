// Location-based news regions data
// 25 regions (excluding education offices: gwangju_edu, jeonnam_edu)

export interface RegionInfo {
    name: string;
    type: 'metro' | 'city' | 'county';
}

export const REGIONS: Record<string, RegionInfo> = {
    // Metro (1)
    gwangju: { name: '광주광역시', type: 'metro' },

    // Cities (5)
    mokpo: { name: '목포시', type: 'city' },
    yeosu: { name: '여수시', type: 'city' },
    suncheon: { name: '순천시', type: 'city' },
    naju: { name: '나주시', type: 'city' },
    gwangyang: { name: '광양시', type: 'city' },

    // Counties (17)
    damyang: { name: '담양군', type: 'county' },
    gokseong: { name: '곡성군', type: 'county' },
    gurye: { name: '구례군', type: 'county' },
    goheung: { name: '고흥군', type: 'county' },
    boseong: { name: '보성군', type: 'county' },
    hwasun: { name: '화순군', type: 'county' },
    jangheung: { name: '장흥군', type: 'county' },
    gangjin: { name: '강진군', type: 'county' },
    haenam: { name: '해남군', type: 'county' },
    yeongam: { name: '영암군', type: 'county' },
    muan: { name: '무안군', type: 'county' },
    hampyeong: { name: '함평군', type: 'county' },
    yeonggwang: { name: '영광군', type: 'county' },
    jangseong: { name: '장성군', type: 'county' },
    wando: { name: '완도군', type: 'county' },
    jindo: { name: '진도군', type: 'county' },
    sinan: { name: '신안군', type: 'county' },
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
    metro: RegionCode[];
    city: RegionCode[];
    county: RegionCode[];
} {
    const result = { metro: [] as RegionCode[], city: [] as RegionCode[], county: [] as RegionCode[] };

    for (const [code, info] of Object.entries(REGIONS)) {
        result[info.type].push(code as RegionCode);
    }

    return result;
}

// Validate if a string is a valid region code
export function isValidRegionCode(code: string): code is RegionCode {
    return code in REGIONS;
}
