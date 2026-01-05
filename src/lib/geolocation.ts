/**
 * National Geolocation Module
 * Supports all 17 provinces/cities and 250+ districts
 */

import {
    getAllRegions,
    getRegionByCode,
    getDistrictByCode,
    Region,
    District,
} from './national-regions';

// 시/도 이름 → 코드 매핑 (전국)
const SIDO_MAP: Record<string, string> = {
    // 특별시/광역시
    '서울': 'seoul', '서울특별시': 'seoul',
    '부산': 'busan', '부산광역시': 'busan',
    '대구': 'daegu', '대구광역시': 'daegu',
    '인천': 'incheon', '인천광역시': 'incheon',
    '광주': 'gwangju', '광주광역시': 'gwangju',
    '대전': 'daejeon', '대전광역시': 'daejeon',
    '울산': 'ulsan', '울산광역시': 'ulsan',
    '세종': 'sejong', '세종특별자치시': 'sejong',
    // 도
    '경기': 'gyeonggi', '경기도': 'gyeonggi',
    '강원': 'gangwon', '강원도': 'gangwon', '강원특별자치도': 'gangwon',
    '충북': 'chungbuk', '충청북도': 'chungbuk',
    '충남': 'chungnam', '충청남도': 'chungnam',
    '전북': 'jeonbuk', '전라북도': 'jeonbuk', '전북특별자치도': 'jeonbuk',
    '전남': 'jeonnam', '전라남도': 'jeonnam',
    '경북': 'gyeongbuk', '경상북도': 'gyeongbuk',
    '경남': 'gyeongnam', '경상남도': 'gyeongnam',
    '제주': 'jeju', '제주도': 'jeju', '제주특별자치도': 'jeju',
};

// 시/군/구 → 시/도 + 시/군/구 코드 매핑 (주요 도시)
const SIGUNGU_MAP: Record<string, { sido: string; sigungu: string }> = {
    // 전남 주요 도시
    '나주': { sido: 'jeonnam', sigungu: 'naju' }, '나주시': { sido: 'jeonnam', sigungu: 'naju' },
    '목포': { sido: 'jeonnam', sigungu: 'mokpo' }, '목포시': { sido: 'jeonnam', sigungu: 'mokpo' },
    '여수': { sido: 'jeonnam', sigungu: 'yeosu' }, '여수시': { sido: 'jeonnam', sigungu: 'yeosu' },
    '순천': { sido: 'jeonnam', sigungu: 'suncheon' }, '순천시': { sido: 'jeonnam', sigungu: 'suncheon' },
    '광양': { sido: 'jeonnam', sigungu: 'gwangyang' }, '광양시': { sido: 'jeonnam', sigungu: 'gwangyang' },
    '담양': { sido: 'jeonnam', sigungu: 'damyang' }, '담양군': { sido: 'jeonnam', sigungu: 'damyang' },
    '곡성': { sido: 'jeonnam', sigungu: 'gokseong' }, '곡성군': { sido: 'jeonnam', sigungu: 'gokseong' },
    '구례': { sido: 'jeonnam', sigungu: 'gurye' }, '구례군': { sido: 'jeonnam', sigungu: 'gurye' },
    '고흥': { sido: 'jeonnam', sigungu: 'goheung' }, '고흥군': { sido: 'jeonnam', sigungu: 'goheung' },
    '보성': { sido: 'jeonnam', sigungu: 'boseong' }, '보성군': { sido: 'jeonnam', sigungu: 'boseong' },
    '화순': { sido: 'jeonnam', sigungu: 'hwasun' }, '화순군': { sido: 'jeonnam', sigungu: 'hwasun' },
    '장흥': { sido: 'jeonnam', sigungu: 'jangheung' }, '장흥군': { sido: 'jeonnam', sigungu: 'jangheung' },
    '강진': { sido: 'jeonnam', sigungu: 'gangjin' }, '강진군': { sido: 'jeonnam', sigungu: 'gangjin' },
    '해남': { sido: 'jeonnam', sigungu: 'haenam' }, '해남군': { sido: 'jeonnam', sigungu: 'haenam' },
    '영암': { sido: 'jeonnam', sigungu: 'yeongam' }, '영암군': { sido: 'jeonnam', sigungu: 'yeongam' },
    '무안': { sido: 'jeonnam', sigungu: 'muan' }, '무안군': { sido: 'jeonnam', sigungu: 'muan' },
    '함평': { sido: 'jeonnam', sigungu: 'hampyeong' }, '함평군': { sido: 'jeonnam', sigungu: 'hampyeong' },
    '영광': { sido: 'jeonnam', sigungu: 'yeonggwang' }, '영광군': { sido: 'jeonnam', sigungu: 'yeonggwang' },
    '장성': { sido: 'jeonnam', sigungu: 'jangseong' }, '장성군': { sido: 'jeonnam', sigungu: 'jangseong' },
    '완도': { sido: 'jeonnam', sigungu: 'wando' }, '완도군': { sido: 'jeonnam', sigungu: 'wando' },
    '진도': { sido: 'jeonnam', sigungu: 'jindo' }, '진도군': { sido: 'jeonnam', sigungu: 'jindo' },
    '신안': { sido: 'jeonnam', sigungu: 'shinan' }, '신안군': { sido: 'jeonnam', sigungu: 'shinan' },
    // 경기 주요 도시
    '수원': { sido: 'gyeonggi', sigungu: 'suwon' }, '수원시': { sido: 'gyeonggi', sigungu: 'suwon' },
    '성남': { sido: 'gyeonggi', sigungu: 'seongnam' }, '성남시': { sido: 'gyeonggi', sigungu: 'seongnam' },
    '고양': { sido: 'gyeonggi', sigungu: 'goyang' }, '고양시': { sido: 'gyeonggi', sigungu: 'goyang' },
    '용인': { sido: 'gyeonggi', sigungu: 'yongin' }, '용인시': { sido: 'gyeonggi', sigungu: 'yongin' },
    '부천': { sido: 'gyeonggi', sigungu: 'bucheon' }, '부천시': { sido: 'gyeonggi', sigungu: 'bucheon' },
    '안산': { sido: 'gyeonggi', sigungu: 'ansan' }, '안산시': { sido: 'gyeonggi', sigungu: 'ansan' },
    '안양': { sido: 'gyeonggi', sigungu: 'anyang' }, '안양시': { sido: 'gyeonggi', sigungu: 'anyang' },
    '화성': { sido: 'gyeonggi', sigungu: 'hwaseong' }, '화성시': { sido: 'gyeonggi', sigungu: 'hwaseong' },
};

// Legacy: 기존 지역 코드 → 한글 이름 매핑 (하위 호환성)

// 지역 코드 → 한글 이름 매핑
export const REGION_NAMES: Record<string, string> = {
    gwangju: '광주광역시',
    jeonnam: '전라남도',
    naju: '나주시',
    mokpo: '목포시',
    yeosu: '여수시',
    suncheon: '순천시',
    gwangyang: '광양시',
    damyang: '담양군',
    gokseong: '곡성군',
    gurye: '구례군',
    goheung: '고흥군',
    boseong: '보성군',
    hwasun: '화순군',
    jangheung: '장흥군',
    gangjin: '강진군',
    haenam: '해남군',
    yeongam: '영암군',
    muan: '무안군',
    hampyeong: '함평군',
    yeonggwang: '영광군',
    jangseong: '장성군',
    wando: '완도군',
    jindo: '진도군',
    shinan: '신안군',
};

export interface RegionInfo {
    code: string;
    name: string;
}

// Extended region info with sido + sigungu
export interface ExtendedRegionInfo {
    sido: {
        code: string;
        name: string;
    };
    sigungu?: {
        code: string;
        name: string;
    };
    source: 'ip' | 'cookie' | 'default';
    raw?: {
        city?: string;
        region?: string;
    };
}

/**
 * IP 주소로 지역 감지 (레거시 - 하위 호환성)
 * @param ip - 클라이언트 IP 주소
 * @returns 지역 정보 또는 null
 */
export async function detectRegionByIP(ip: string): Promise<RegionInfo | null> {
    const extended = await detectRegionExtended(ip);
    if (!extended) return null;

    // Return sigungu if available, otherwise sido
    if (extended.sigungu) {
        return { code: extended.sigungu.code, name: extended.sigungu.name };
    }
    return { code: extended.sido.code, name: extended.sido.name };
}

/**
 * IP 주소로 전국 지역 감지 (확장)
 * @param ip - 클라이언트 IP 주소
 * @returns 시/도 + 시/군/구 정보
 */
export async function detectRegionExtended(ip: string): Promise<ExtendedRegionInfo | null> {
    // 로컬 개발 환경 - 기본값 광주
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
            sido: { code: 'gwangju', name: '광주광역시' },
            source: 'default',
        };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        // ip-api.com 무료 API 사용 (1분당 45요청 제한)
        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,city,regionName&lang=ko`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        const data = await response.json();

        if (data.status !== 'success') return null;

        const city = data.city || '';
        const region = data.regionName || '';

        // 1. 먼저 시/군/구 레벨에서 매칭 시도
        for (const [name, mapping] of Object.entries(SIGUNGU_MAP)) {
            if (city.includes(name) || city === name) {
                const sidoInfo = getRegionByCode(mapping.sido);
                const sigunguInfo = getDistrictByCode(mapping.sido, mapping.sigungu);

                return {
                    sido: {
                        code: mapping.sido,
                        name: sidoInfo?.name || mapping.sido
                    },
                    sigungu: sigunguInfo ? {
                        code: sigunguInfo.code,
                        name: sigunguInfo.name,
                    } : undefined,
                    source: 'ip',
                    raw: { city, region },
                };
            }
        }

        // 2. 시/도 레벨에서 매칭
        for (const [name, sidoCode] of Object.entries(SIDO_MAP)) {
            if (region.includes(name) || region === name || city.includes(name)) {
                const sidoInfo = getRegionByCode(sidoCode);

                return {
                    sido: {
                        code: sidoCode,
                        name: sidoInfo?.name || name
                    },
                    source: 'ip',
                    raw: { city, region },
                };
            }
        }

        // 3. 부분 매칭 시도
        const allSidoKeys = Object.keys(SIDO_MAP);
        for (const key of allSidoKeys) {
            if (city.includes(key) || region.includes(key)) {
                const sidoCode = SIDO_MAP[key];
                const sidoInfo = getRegionByCode(sidoCode);

                return {
                    sido: {
                        code: sidoCode,
                        name: sidoInfo?.name || key
                    },
                    source: 'ip',
                    raw: { city, region },
                };
            }
        }

        return null;
    } catch (error) {
        console.error('IP Geolocation 실패:', error);
        return null;
    }
}

/**
 * Request에서 클라이언트 IP 추출
 */
export function getClientIP(request: Request): string {
    // Vercel/Cloudflare 등의 프록시 헤더
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    return '127.0.0.1';
}

/**
 * 지역 코드가 유효한지 확인
 */
export function isValidRegionCode(code: string): boolean {
    return code in REGION_NAMES;
}
