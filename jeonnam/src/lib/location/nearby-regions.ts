// Nearby regions mapping
// Each region has 4 nearby regions based on geographic proximity

import { RegionCode } from './regions';

export const NEARBY_REGIONS: Record<RegionCode, RegionCode[]> = {
    // Metro
    gwangju: ['naju', 'damyang', 'hwasun', 'jangseong'],

    // Cities
    mokpo: ['muan', 'sinan', 'yeongam', 'haenam'],
    yeosu: ['suncheon', 'gwangyang', 'goheung', 'boseong'],
    suncheon: ['yeosu', 'gwangyang', 'boseong', 'goheung'],
    naju: ['gwangju', 'hwasun', 'yeongam', 'hampyeong'],
    gwangyang: ['suncheon', 'yeosu', 'gurye', 'gokseong'],

    // Counties
    damyang: ['gwangju', 'gokseong', 'jangseong', 'hwasun'],
    gokseong: ['gurye', 'damyang', 'suncheon', 'gwangyang'],
    gurye: ['gwangyang', 'gokseong', 'suncheon', 'damyang'],
    goheung: ['boseong', 'suncheon', 'yeosu', 'jangheung'],
    boseong: ['suncheon', 'hwasun', 'jangheung', 'goheung'],
    hwasun: ['gwangju', 'naju', 'boseong', 'jangheung'],
    jangheung: ['boseong', 'gangjin', 'hwasun', 'yeongam'],
    gangjin: ['jangheung', 'haenam', 'yeongam', 'wando'],
    haenam: ['mokpo', 'yeongam', 'gangjin', 'wando'],
    yeongam: ['mokpo', 'naju', 'gangjin', 'haenam'],
    muan: ['mokpo', 'sinan', 'hampyeong', 'yeongam'],
    hampyeong: ['muan', 'naju', 'yeonggwang', 'jangseong'],
    yeonggwang: ['hampyeong', 'jangseong', 'sinan', 'muan'],
    jangseong: ['gwangju', 'damyang', 'yeonggwang', 'hampyeong'],
    wando: ['haenam', 'gangjin', 'jangheung', 'jindo'],
    jindo: ['haenam', 'wando', 'sinan', 'mokpo'],
    sinan: ['mokpo', 'muan', 'yeonggwang', 'hampyeong'],
};

// Get nearby regions for a given region
export function getNearbyRegions(code: RegionCode, count: number = 4): RegionCode[] {
    const nearby = NEARBY_REGIONS[code] || [];
    return nearby.slice(0, count);
}
