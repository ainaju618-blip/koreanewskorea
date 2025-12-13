// 지역 이름 → 코드 매핑
const REGION_MAP: Record<string, string> = {
    '광주': 'gwangju', '광주광역시': 'gwangju',
    '전남': 'jeonnam', '전라남도': 'jeonnam',
    '나주': 'naju', '나주시': 'naju',
    '목포': 'mokpo', '목포시': 'mokpo',
    '여수': 'yeosu', '여수시': 'yeosu',
    '순천': 'suncheon', '순천시': 'suncheon',
    '광양': 'gwangyang', '광양시': 'gwangyang',
    '담양': 'damyang', '담양군': 'damyang',
    '곡성': 'gokseong', '곡성군': 'gokseong',
    '구례': 'gurye', '구례군': 'gurye',
    '고흥': 'goheung', '고흥군': 'goheung',
    '보성': 'boseong', '보성군': 'boseong',
    '화순': 'hwasun', '화순군': 'hwasun',
    '장흥': 'jangheung', '장흥군': 'jangheung',
    '강진': 'gangjin', '강진군': 'gangjin',
    '해남': 'haenam', '해남군': 'haenam',
    '영암': 'yeongam', '영암군': 'yeongam',
    '무안': 'muan', '무안군': 'muan',
    '함평': 'hampyeong', '함평군': 'hampyeong',
    '영광': 'yeonggwang', '영광군': 'yeonggwang',
    '장성': 'jangseong', '장성군': 'jangseong',
    '완도': 'wando', '완도군': 'wando',
    '진도': 'jindo', '진도군': 'jindo',
    '신안': 'shinan', '신안군': 'shinan',
};

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

/**
 * IP 주소로 지역 감지
 * @param ip - 클라이언트 IP 주소
 * @returns 지역 정보 또는 null
 */
export async function detectRegionByIP(ip: string): Promise<RegionInfo | null> {
    // 로컬 개발 환경
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { code: 'gwangju', name: '광주광역시' };
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

        // city 또는 regionName에서 지역 코드 찾기
        const city = data.city || '';
        const region = data.regionName || '';

        for (const [name, code] of Object.entries(REGION_MAP)) {
            if (city.includes(name) || region.includes(name)) {
                return { code, name: REGION_NAMES[code] || name };
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
