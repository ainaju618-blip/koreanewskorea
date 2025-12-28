/**
 * Korea NEWS Regional Site Configuration
 * =======================================
 * Electoral district-based site groupings with weighted article display
 *
 * 9 Sites for Jeonnam Province (based on National Assembly electoral districts):
 * 1. Mokpo/Yeongam/Muan/Sinan (mokpo.koreanewskorea.com)
 * 2. Yeosu (yeosu.koreanewskorea.com)
 * 3. Suncheon (suncheon.koreanewskorea.com)
 * 4. Naju/Hwasun (naju.koreanewskorea.com)
 * 5. Gwangyang/Gokseong/Gurye (gwangyang.koreanewskorea.com)
 * 6. Damyang/Hampyeong/Yeonggwang/Jangseong (damyang.koreanewskorea.com)
 * 7. Goheung/Boseong/Jangheung/Gangjin (goheung.koreanewskorea.com)
 * 8. Haenam/Wando/Jindo (haenam.koreanewskorea.com)
 * 9. Gwangju (gwangju.koreanewskorea.com)
 */

export interface RegionGroup {
    names: string[];      // Korean names for DB matching
    slugs: string[];      // URL slugs
}

export interface SiteConfig {
    id: string;
    name: string;
    subtitle: string;
    port: number;
    domain: string;

    // Region groups with weights
    regions: {
        primary: RegionGroup;     // Weight: 1.0
        adjacent1: RegionGroup;   // Weight: 0.7
        adjacent2: RegionGroup;   // Weight: 0.4
        province: RegionGroup;    // Weight: 0.3
    };

    // Weight values
    weights: {
        primary: number;
        adjacent1: number;
        adjacent2: number;
        province: number;
    };

    // Hero carousel settings
    hero: {
        articleCount: number;
        primaryMinCount: number;
        intervals: {
            primary: number;
            adjacent1: number;
            adjacent2: number;
            province: number;
        };
    };
}

// Current site configuration (Mokpo/Yeongam/Muan/Sinan)
export const CURRENT_SITE: SiteConfig = {
    id: 'mokpo',
    name: '목포/영암/무안/신안',
    subtitle: '서해안권 4개 시군 종합 뉴스',
    port: 3002,
    domain: 'mokpo.koreanewskorea.com',

    regions: {
        primary: {
            names: ['목포', '영암', '무안', '신안'],
            slugs: ['mokpo', 'yeongam', 'muan', 'sinan'],
        },
        adjacent1: {
            names: ['함평', '해남', '나주'],
            slugs: ['hampyeong', 'haenam', 'naju'],
        },
        adjacent2: {
            names: ['영광', '진도', '완도'],
            slugs: ['yeonggwang', 'jindo', 'wando'],
        },
        province: {
            names: ['전남', '전라남도'],
            slugs: ['jeonnam', 'jeonnamdo'],
        },
    },

    weights: {
        primary: 1.0,
        adjacent1: 0.7,
        adjacent2: 0.4,
        province: 0.3,
    },

    hero: {
        articleCount: 5,
        primaryMinCount: 3,
        intervals: {
            primary: 7000,
            adjacent1: 5000,
            adjacent2: 4000,
            province: 3000,
        },
    },
};

// All 9 site configurations
export const ALL_SITES: Record<string, SiteConfig> = {
    'mokpo': CURRENT_SITE,

    'yeosu': {
        id: 'yeosu',
        name: '여수',
        subtitle: '여수시 종합 뉴스',
        port: 3003,
        domain: 'yeosu.koreanewskorea.com',
        regions: {
            primary: {
                names: ['여수'],
                slugs: ['yeosu'],
            },
            adjacent1: {
                names: ['순천', '광양', '고흥'],
                slugs: ['suncheon', 'gwangyang', 'goheung'],
            },
            adjacent2: {
                names: ['보성', '곡성', '구례'],
                slugs: ['boseong', 'gokseong', 'gurye'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },

    'suncheon': {
        id: 'suncheon',
        name: '순천',
        subtitle: '순천시 종합 뉴스',
        port: 3004,
        domain: 'suncheon.koreanewskorea.com',
        regions: {
            primary: {
                names: ['순천'],
                slugs: ['suncheon'],
            },
            adjacent1: {
                names: ['여수', '광양', '보성', '곡성'],
                slugs: ['yeosu', 'gwangyang', 'boseong', 'gokseong'],
            },
            adjacent2: {
                names: ['고흥', '구례', '화순'],
                slugs: ['goheung', 'gurye', 'hwasun'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },

    'naju': {
        id: 'naju',
        name: '나주/화순',
        subtitle: '나주시, 화순군 종합 뉴스',
        port: 3005,
        domain: 'naju.koreanewskorea.com',
        regions: {
            primary: {
                names: ['나주', '화순'],
                slugs: ['naju', 'hwasun'],
            },
            adjacent1: {
                names: ['광주', '담양', '영암', '목포'],
                slugs: ['gwangju', 'damyang', 'yeongam', 'mokpo'],
            },
            adjacent2: {
                names: ['함평', '장성', '보성', '순천'],
                slugs: ['hampyeong', 'jangseong', 'boseong', 'suncheon'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },

    'gwangyang': {
        id: 'gwangyang',
        name: '광양/곡성/구례',
        subtitle: '동부권 3개 시군 종합 뉴스',
        port: 3006,
        domain: 'gwangyang.koreanewskorea.com',
        regions: {
            primary: {
                names: ['광양', '곡성', '구례'],
                slugs: ['gwangyang', 'gokseong', 'gurye'],
            },
            adjacent1: {
                names: ['순천', '여수', '담양'],
                slugs: ['suncheon', 'yeosu', 'damyang'],
            },
            adjacent2: {
                names: ['나주', '화순', '보성'],
                slugs: ['naju', 'hwasun', 'boseong'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },

    'damyang': {
        id: 'damyang',
        name: '담양/함평/영광/장성',
        subtitle: '북부권 4개 군 종합 뉴스',
        port: 3007,
        domain: 'damyang.koreanewskorea.com',
        regions: {
            primary: {
                names: ['담양', '함평', '영광', '장성'],
                slugs: ['damyang', 'hampyeong', 'yeonggwang', 'jangseong'],
            },
            adjacent1: {
                names: ['광주', '나주', '무안', '목포'],
                slugs: ['gwangju', 'naju', 'muan', 'mokpo'],
            },
            adjacent2: {
                names: ['화순', '곡성', '영암', '신안'],
                slugs: ['hwasun', 'gokseong', 'yeongam', 'sinan'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },

    'goheung': {
        id: 'goheung',
        name: '고흥/보성/장흥/강진',
        subtitle: '남부권 4개 군 종합 뉴스',
        port: 3008,
        domain: 'goheung.koreanewskorea.com',
        regions: {
            primary: {
                names: ['고흥', '보성', '장흥', '강진'],
                slugs: ['goheung', 'boseong', 'jangheung', 'gangjin'],
            },
            adjacent1: {
                names: ['여수', '순천', '해남', '화순'],
                slugs: ['yeosu', 'suncheon', 'haenam', 'hwasun'],
            },
            adjacent2: {
                names: ['영암', '완도', '광양'],
                slugs: ['yeongam', 'wando', 'gwangyang'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },

    'haenam': {
        id: 'haenam',
        name: '해남/완도/진도',
        subtitle: '서남해권 3개 군 종합 뉴스',
        port: 3009,
        domain: 'haenam.koreanewskorea.com',
        regions: {
            primary: {
                names: ['해남', '완도', '진도'],
                slugs: ['haenam', 'wando', 'jindo'],
            },
            adjacent1: {
                names: ['강진', '영암', '목포', '무안'],
                slugs: ['gangjin', 'yeongam', 'mokpo', 'muan'],
            },
            adjacent2: {
                names: ['장흥', '신안', '보성'],
                slugs: ['jangheung', 'sinan', 'boseong'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },

    'gwangju': {
        id: 'gwangju',
        name: '광주',
        subtitle: '광주광역시 종합 뉴스',
        port: 3010,
        domain: 'gwangju.koreanewskorea.com',
        regions: {
            primary: {
                names: ['광주'],
                slugs: ['gwangju'],
            },
            adjacent1: {
                names: ['나주', '담양', '장성', '화순'],
                slugs: ['naju', 'damyang', 'jangseong', 'hwasun'],
            },
            adjacent2: {
                names: ['함평', '영광', '곡성', '순천'],
                slugs: ['hampyeong', 'yeonggwang', 'gokseong', 'suncheon'],
            },
            province: {
                names: ['전남', '전라남도'],
                slugs: ['jeonnam', 'jeonnamdo'],
            },
        },
        weights: { primary: 1.0, adjacent1: 0.7, adjacent2: 0.4, province: 0.3 },
        hero: {
            articleCount: 5,
            primaryMinCount: 3,
            intervals: { primary: 7000, adjacent1: 5000, adjacent2: 4000, province: 3000 },
        },
    },
};

// Helper function to get all region names for a site
export function getAllRegionNames(config: SiteConfig): string[] {
    return [
        ...config.regions.primary.names,
        ...config.regions.adjacent1.names,
        ...config.regions.adjacent2.names,
        ...config.regions.province.names,
    ];
}

// Helper function to get all region slugs for a site
export function getAllRegionSlugs(config: SiteConfig): string[] {
    return [
        ...config.regions.primary.slugs,
        ...config.regions.adjacent1.slugs,
        ...config.regions.adjacent2.slugs,
        ...config.regions.province.slugs,
    ];
}

export type RegionType = 'primary' | 'adjacent1' | 'adjacent2' | 'province';

// Helper function to determine region type from article
export function getRegionType(
    category: string | null,
    region: string | null,
    config: SiteConfig
): RegionType {
    const cat = category?.toLowerCase() || '';
    const reg = region?.toLowerCase() || '';

    // Check primary regions
    if (config.regions.primary.names.some(n =>
        cat.includes(n.toLowerCase()) || reg.includes(n.toLowerCase())
    )) {
        return 'primary';
    }

    // Check adjacent1 regions
    if (config.regions.adjacent1.names.some(n =>
        cat.includes(n.toLowerCase()) || reg.includes(n.toLowerCase())
    )) {
        return 'adjacent1';
    }

    // Check adjacent2 regions
    if (config.regions.adjacent2.names.some(n =>
        cat.includes(n.toLowerCase()) || reg.includes(n.toLowerCase())
    )) {
        return 'adjacent2';
    }

    // Default to province
    return 'province';
}
