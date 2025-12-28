import { cookies } from 'next/headers';

export interface PersonalizationCookies {
    sessionId: string;
    region: string | null;
    preferredRegion: string | null;
    consent: 'all' | 'essential' | null;
}

/**
 * 서버 사이드에서 개인화 쿠키 읽기
 */
export async function getPersonalizationCookies(): Promise<PersonalizationCookies> {
    const cookieStore = await cookies();

    return {
        sessionId: cookieStore.get('kn_session')?.value || '',
        region: cookieStore.get('kn_region')?.value || null,
        preferredRegion: cookieStore.get('kn_pref_region')?.value || null,
        consent: cookieStore.get('kn_consent')?.value as 'all' | 'essential' | null,
    };
}

/**
 * 세션 ID 생성 (UUID v4)
 */
export function generateSessionId(): string {
    return crypto.randomUUID();
}

/**
 * 쿠키 이름 상수
 */
export const COOKIE_NAMES = {
    SESSION: 'kn_session',
    REGION: 'kn_region',
    PREFERRED_REGION: 'kn_pref_region',
    CONSENT: 'kn_consent',
} as const;

/**
 * 쿠키 만료 시간 (1년)
 */
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
