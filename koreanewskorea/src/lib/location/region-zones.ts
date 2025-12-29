// Region zones mapping
// Used when IP detection returns ambiguous location

import { RegionCode } from './regions';

// Zone to major city mapping
export const ZONE_CITIES = {
    east: 'suncheon',   // Eastern region: Suncheon, Yeosu, Gwangyang, Gurye, Gokseong, Goheung, Boseong
    west: 'mokpo',      // Western region: Mokpo, Muan, Sinan, Yeongam, Haenam, Jindo, Wando
    central: 'naju',    // Central region: Naju, Hwasun, Jangheung, Gangjin, Yeonggwang, Hampyeong
    north: 'gwangju',   // Northern region: Gwangju, Damyang, Jangseong
} as const;

export type ZoneCode = keyof typeof ZONE_CITIES;

// Region to zone mapping
export const REGION_ZONES: Record<RegionCode, ZoneCode> = {
    // Northern zone (gwangju)
    gwangju: 'north',
    damyang: 'north',
    jangseong: 'north',

    // Eastern zone (suncheon)
    suncheon: 'east',
    yeosu: 'east',
    gwangyang: 'east',
    gurye: 'east',
    gokseong: 'east',
    goheung: 'east',
    boseong: 'east',

    // Western zone (mokpo)
    mokpo: 'west',
    muan: 'west',
    sinan: 'west',
    yeongam: 'west',
    haenam: 'west',
    jindo: 'west',
    wando: 'west',

    // Central zone (naju)
    naju: 'central',
    hwasun: 'central',
    jangheung: 'central',
    gangjin: 'central',
    yeonggwang: 'central',
    hampyeong: 'central',
};

// Get major city for a zone
export function getZoneMajorCity(zone: ZoneCode): RegionCode {
    return ZONE_CITIES[zone] as RegionCode;
}

// Get zone for a region
export function getRegionZone(code: RegionCode): ZoneCode {
    return REGION_ZONES[code];
}

// Default region when detection fails
export const DEFAULT_REGION: RegionCode = 'gwangju';
