/**
 * Korea NEWS Regional Homepage System
 * Region Configuration & Utilities
 * 
 * Reference: plan/regions/*.md, plan/regional-homepage-spec.md
 */

// ==============================================
// Types
// ==============================================

export interface RegionConfig {
    code: string;
    nameKo: string;
    nameEn: string;
    tier: 1 | 2 | 3;
    nearby: string[];
    scraperPath?: string;
}

// ==============================================
// Region Data (24 Regions)
// ==============================================

const REGIONS: Record<string, RegionConfig> = {
    // Tier 1: Metro/Province (2)
    gwangju: {
        code: 'gwangju',
        nameKo: '광주',
        nameEn: 'Gwangju',
        tier: 1,
        nearby: ['jeonnam', 'damyang', 'hwasun', 'naju', 'hampyeong'],
        scraperPath: 'scrapers/gwangju',
    },
    jeonnam: {
        code: 'jeonnam',
        nameKo: '전남',
        nameEn: 'Jeonnam',
        tier: 1,
        nearby: ['gwangju', 'mokpo', 'yeosu', 'suncheon', 'naju'],
        scraperPath: 'scrapers/jeonnam',
    },

    // Tier 2: Cities (5)
    mokpo: {
        code: 'mokpo',
        nameKo: '목포',
        nameEn: 'Mokpo',
        tier: 2,
        nearby: ['muan', 'shinan', 'yeongam', 'haenam', 'jeonnam'],
        scraperPath: 'scrapers/mokpo',
    },
    yeosu: {
        code: 'yeosu',
        nameKo: '여수',
        nameEn: 'Yeosu',
        tier: 2,
        nearby: ['suncheon', 'gwangyang', 'goheung', 'jeonnam'],
        scraperPath: 'scrapers/yeosu',
    },
    suncheon: {
        code: 'suncheon',
        nameKo: '순천',
        nameEn: 'Suncheon',
        tier: 2,
        nearby: ['yeosu', 'gwangyang', 'boseong', 'goheung', 'jeonnam'],
        scraperPath: 'scrapers/suncheon',
    },
    naju: {
        code: 'naju',
        nameKo: '나주',
        nameEn: 'Naju',
        tier: 2,
        nearby: ['gwangju', 'hampyeong', 'muan', 'yeongam', 'jeonnam'],
        scraperPath: 'scrapers/naju',
    },
    gwangyang: {
        code: 'gwangyang',
        nameKo: '광양',
        nameEn: 'Gwangyang',
        tier: 2,
        nearby: ['suncheon', 'yeosu', 'gurye', 'jeonnam'],
        scraperPath: 'scrapers/gwangyang',
    },

    // Tier 3: Counties (17)
    damyang: {
        code: 'damyang',
        nameKo: '담양',
        nameEn: 'Damyang',
        tier: 3,
        nearby: ['gwangju', 'jangseong', 'gokseong', 'hwasun'],
        scraperPath: 'scrapers/damyang',
    },
    gokseong: {
        code: 'gokseong',
        nameKo: '곡성',
        nameEn: 'Gokseong',
        tier: 3,
        nearby: ['damyang', 'gurye', 'suncheon', 'hwasun'],
        scraperPath: 'scrapers/gokseong',
    },
    gurye: {
        code: 'gurye',
        nameKo: '구례',
        nameEn: 'Gurye',
        tier: 3,
        nearby: ['gokseong', 'suncheon', 'gwangyang'],
        scraperPath: 'scrapers/gurye',
    },
    goheung: {
        code: 'goheung',
        nameKo: '고흥',
        nameEn: 'Goheung',
        tier: 3,
        nearby: ['boseong', 'yeosu', 'suncheon'],
        scraperPath: 'scrapers/goheung',
    },
    boseong: {
        code: 'boseong',
        nameKo: '보성',
        nameEn: 'Boseong',
        tier: 3,
        nearby: ['suncheon', 'goheung', 'jangheung', 'hwasun'],
        scraperPath: 'scrapers/boseong',
    },
    hwasun: {
        code: 'hwasun',
        nameKo: '화순',
        nameEn: 'Hwasun',
        tier: 3,
        nearby: ['gwangju', 'damyang', 'boseong', 'naju'],
        scraperPath: 'scrapers/hwasun',
    },
    jangheung: {
        code: 'jangheung',
        nameKo: '장흥',
        nameEn: 'Jangheung',
        tier: 3,
        nearby: ['boseong', 'gangjin', 'yeongam'],
        scraperPath: 'scrapers/jangheung',
    },
    gangjin: {
        code: 'gangjin',
        nameKo: '강진',
        nameEn: 'Gangjin',
        tier: 3,
        nearby: ['jangheung', 'haenam', 'yeongam'],
        scraperPath: 'scrapers/gangjin',
    },
    haenam: {
        code: 'haenam',
        nameKo: '해남',
        nameEn: 'Haenam',
        tier: 3,
        nearby: ['gangjin', 'wando', 'jindo', 'yeongam', 'mokpo'],
        scraperPath: 'scrapers/haenam',
    },
    yeongam: {
        code: 'yeongam',
        nameKo: '영암',
        nameEn: 'Yeongam',
        tier: 3,
        nearby: ['mokpo', 'naju', 'gangjin', 'haenam', 'jangheung'],
        scraperPath: 'scrapers/yeongam',
    },
    muan: {
        code: 'muan',
        nameKo: '무안',
        nameEn: 'Muan',
        tier: 3,
        nearby: ['mokpo', 'naju', 'hampyeong', 'shinan'],
        scraperPath: 'scrapers/muan',
    },
    hampyeong: {
        code: 'hampyeong',
        nameKo: '함평',
        nameEn: 'Hampyeong',
        tier: 3,
        nearby: ['naju', 'muan', 'yeonggwang', 'jangseong', 'gwangju'],
        scraperPath: 'scrapers/hampyeong',
    },
    yeonggwang: {
        code: 'yeonggwang',
        nameKo: '영광',
        nameEn: 'Yeonggwang',
        tier: 3,
        nearby: ['hampyeong', 'jangseong'],
        scraperPath: 'scrapers/yeonggwang',
    },
    jangseong: {
        code: 'jangseong',
        nameKo: '장성',
        nameEn: 'Jangseong',
        tier: 3,
        nearby: ['gwangju', 'damyang', 'hampyeong', 'yeonggwang'],
        scraperPath: 'scrapers/jangseong',
    },
    wando: {
        code: 'wando',
        nameKo: '완도',
        nameEn: 'Wando',
        tier: 3,
        nearby: ['haenam', 'gangjin', 'jindo'],
        scraperPath: 'scrapers/wando',
    },
    jindo: {
        code: 'jindo',
        nameKo: '진도',
        nameEn: 'Jindo',
        tier: 3,
        nearby: ['haenam', 'wando', 'shinan'],
        scraperPath: 'scrapers/jindo',
    },
    shinan: {
        code: 'shinan',
        nameKo: '신안',
        nameEn: 'Shinan',
        tier: 3,
        nearby: ['mokpo', 'muan', 'jindo'],
        scraperPath: 'scrapers/shinan',
    },
};

// ==============================================
// Utility Functions
// ==============================================

/**
 * Get all valid region codes
 */
export function getAllRegionCodes(): string[] {
    return Object.keys(REGIONS);
}

/**
 * Check if region code is valid
 */
export function isValidRegion(code: string): boolean {
    return code in REGIONS;
}

/**
 * Get region configuration by code
 */
export function getRegionConfig(code: string): RegionConfig | null {
    return REGIONS[code] ?? null;
}

/**
 * Get nearby region codes
 */
export function getNearbyRegions(code: string): string[] {
    return REGIONS[code]?.nearby ?? [];
}

/**
 * Get region tier (1, 2, or 3)
 */
export function getRegionTier(code: string): 1 | 2 | 3 {
    return REGIONS[code]?.tier ?? 3;
}

/**
 * Get all regions as array
 */
export function getAllRegions(): RegionConfig[] {
    return Object.values(REGIONS);
}

/**
 * Get regions by tier
 */
export function getRegionsByTier(tier: 1 | 2 | 3): RegionConfig[] {
    return Object.values(REGIONS).filter((r) => r.tier === tier);
}

/**
 * Get default region (gwangju)
 */
export function getDefaultRegion(): RegionConfig {
    return REGIONS.gwangju;
}
