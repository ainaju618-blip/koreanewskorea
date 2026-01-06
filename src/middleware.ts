import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// IP 기반 지역 매핑 (헤더용 4개 지역)
type HeaderRegion = 'korea' | 'gwangju' | 'naju' | 'jindo';

const REGION_PATHS: Record<HeaderRegion, string> = {
    korea: '/',
    gwangju: '/region/gwangju',
    naju: '/region/naju',
    jindo: '/region/jindo',
};

// 전남 시군 → 나주로 매핑 (진도 제외)
const JEONNAM_CITIES = [
    '목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례',
    '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안',
    '함평', '영광', '장성', '완도', '신안',
    'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang', 'damyang', 'gokseong', 'gurye',
    'goheung', 'boseong', 'hwasun', 'jangheung', 'gangjin', 'haenam', 'yeongam', 'muan',
    'hampyeong', 'yeonggwang', 'jangseong', 'wando', 'sinan'
];

// IP에서 지역 감지 (Vercel/Cloudflare 헤더 사용)
function detectRegionFromHeaders(request: NextRequest): HeaderRegion {
    // Vercel 지역 헤더
    const vercelCity = request.headers.get('x-vercel-ip-city') || '';
    const vercelRegion = request.headers.get('x-vercel-ip-country-region') || '';

    // Cloudflare 헤더 (백업)
    const cfCity = request.headers.get('cf-ipcity') || '';

    const city = decodeURIComponent(vercelCity || cfCity).toLowerCase();
    const region = decodeURIComponent(vercelRegion).toLowerCase();

    // 광주 판별
    if (city.includes('gwangju') || city.includes('광주') ||
        region.includes('gwangju') || region.includes('광주')) {
        return 'gwangju';
    }

    // 진도 판별
    if (city.includes('jindo') || city.includes('진도')) {
        return 'jindo';
    }

    // 전남 판별 → 나주로
    if (region.includes('jeolla') || region.includes('전라') || region.includes('전남') ||
        JEONNAM_CITIES.some(c => city.includes(c.toLowerCase()))) {
        return 'naju';
    }

    // 기타 → 전국
    return 'korea';
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 루트 페이지 접속 시에만 리다이렉트 처리
    if (pathname !== '/') {
        return NextResponse.next();
    }

    // 이미 리다이렉트 처리된 사용자는 스킵 (쿠키 확인)
    const hasVisited = request.cookies.get('region_redirected');
    if (hasVisited) {
        return NextResponse.next();
    }

    // IP 기반 지역 감지
    const detectedRegion = detectRegionFromHeaders(request);

    // 전국이면 리다이렉트 불필요
    if (detectedRegion === 'korea') {
        const response = NextResponse.next();
        // 방문 기록 쿠키 설정 (24시간)
        response.cookies.set('region_redirected', 'true', {
            maxAge: 60 * 60 * 24,
            path: '/',
        });
        return response;
    }

    // 지역 홈페이지로 리다이렉트
    const redirectUrl = new URL(REGION_PATHS[detectedRegion], request.url);
    const response = NextResponse.redirect(redirectUrl);

    // 방문 기록 쿠키 설정 (24시간)
    response.cookies.set('region_redirected', 'true', {
        maxAge: 60 * 60 * 24,
        path: '/',
    });

    return response;
}

// 미들웨어 적용 경로
export const config = {
    matcher: [
        // 루트 페이지만
        '/',
    ],
};
