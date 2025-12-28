// Region matcher utility
// Converts IP detection results to region codes

import { RegionCode, REGIONS, isValidRegionCode } from './regions';
import { ZONE_CITIES, ZoneCode, DEFAULT_REGION } from './region-zones';

// Korean city name to region code mapping
const CITY_NAME_MAP: Record<string, RegionCode> = {
    // Full names
    '광주광역시': 'gwangju',
    '광주': 'gwangju',
    '목포시': 'mokpo',
    '목포': 'mokpo',
    '여수시': 'yeosu',
    '여수': 'yeosu',
    '순천시': 'suncheon',
    '순천': 'suncheon',
    '나주시': 'naju',
    '나주': 'naju',
    '광양시': 'gwangyang',
    '광양': 'gwangyang',
    '담양군': 'damyang',
    '담양': 'damyang',
    '곡성군': 'gokseong',
    '곡성': 'gokseong',
    '구례군': 'gurye',
    '구례': 'gurye',
    '고흥군': 'goheung',
    '고흥': 'goheung',
    '보성군': 'boseong',
    '보성': 'boseong',
    '화순군': 'hwasun',
    '화순': 'hwasun',
    '장흥군': 'jangheung',
    '장흥': 'jangheung',
    '강진군': 'gangjin',
    '강진': 'gangjin',
    '해남군': 'haenam',
    '해남': 'haenam',
    '영암군': 'yeongam',
    '영암': 'yeongam',
    '무안군': 'muan',
    '무안': 'muan',
    '함평군': 'hampyeong',
    '함평': 'hampyeong',
    '영광군': 'yeonggwang',
    '영광': 'yeonggwang',
    '장성군': 'jangseong',
    '장성': 'jangseong',
    '완도군': 'wando',
    '완도': 'wando',
    '진도군': 'jindo',
    '진도': 'jindo',
    '신안군': 'sinan',
    '신안': 'sinan',

    // English names (lowercase)
    'gwangju': 'gwangju',
    'mokpo': 'mokpo',
    'yeosu': 'yeosu',
    'suncheon': 'suncheon',
    'naju': 'naju',
    'gwangyang': 'gwangyang',
};

// Province name to zone mapping
const PROVINCE_ZONE_MAP: Record<string, ZoneCode> = {
    '전라남도': 'east',      // Default to Suncheon for Jeonnam
    'jeonnam': 'east',
    'south jeolla': 'east',
    '광주광역시': 'north',
    'gwangju': 'north',
};

/**
 * Match city/province names to region code
 * @param city - City name from IP detection
 * @param province - Province/region name from IP detection
 * @returns Matched region code or default
 */
export function matchRegion(city: string, province: string): RegionCode {
    const normalizedCity = city.trim().toLowerCase();
    const normalizedProvince = province.trim().toLowerCase();

    // 1. Try exact city match (Korean)
    if (CITY_NAME_MAP[city]) {
        return CITY_NAME_MAP[city];
    }

    // 2. Try lowercase city match (English)
    if (CITY_NAME_MAP[normalizedCity]) {
        return CITY_NAME_MAP[normalizedCity];
    }

    // 3. Try partial match - check if any region name is contained in city
    for (const [name, code] of Object.entries(CITY_NAME_MAP)) {
        if (normalizedCity.includes(name.toLowerCase()) || name.toLowerCase().includes(normalizedCity)) {
            return code;
        }
    }

    // 4. Check province and return zone major city
    if (PROVINCE_ZONE_MAP[province] || PROVINCE_ZONE_MAP[normalizedProvince]) {
        const zone = PROVINCE_ZONE_MAP[province] || PROVINCE_ZONE_MAP[normalizedProvince];
        return ZONE_CITIES[zone] as RegionCode;
    }

    // 5. Check if province contains "전남" or "광주"
    if (normalizedProvince.includes('전남') || normalizedProvince.includes('jeonnam') || normalizedProvince.includes('jeolla')) {
        return ZONE_CITIES.east as RegionCode; // Suncheon
    }

    if (normalizedProvince.includes('광주') || normalizedProvince.includes('gwangju')) {
        return ZONE_CITIES.north as RegionCode; // Gwangju
    }

    // 6. Default to Gwangju
    return DEFAULT_REGION;
}

/**
 * Validate and normalize region code
 * @param code - Potential region code
 * @returns Valid region code or default
 */
export function normalizeRegionCode(code: string): RegionCode {
    const normalized = code.trim().toLowerCase();

    if (isValidRegionCode(normalized)) {
        return normalized;
    }

    // Try city name mapping
    if (CITY_NAME_MAP[code] || CITY_NAME_MAP[normalized]) {
        return CITY_NAME_MAP[code] || CITY_NAME_MAP[normalized];
    }

    return DEFAULT_REGION;
}
