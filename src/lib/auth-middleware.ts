/**
 * Admin API 인증 미들웨어
 * 관리자 API 라우트에서 인증을 처리합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// 세션 유효 시간 (24시간)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// 세션 데이터 타입
interface AdminSession {
  authenticated: boolean;
  timestamp: number;
  expiresAt: number;
  csrf?: string;
}

/**
 * 관리자 세션 쿠키 이름
 */
export const ADMIN_SESSION_COOKIE = 'admin_session';
export const CSRF_COOKIE = 'csrf_token';

/**
 * 세션 토큰 생성 (HMAC 기반)
 */
export function createSessionToken(data: AdminSession): string {
  const secret = process.env.SESSION_SECRET || 'koreanews-session-secret-change-in-production';
  const payload = JSON.stringify(data);
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // payload.signature 형식으로 토큰 생성
  const token = Buffer.from(`${payload}.${signature}`).toString('base64');
  return token;
}

/**
 * 세션 토큰 검증
 */
export function verifySessionToken(token: string): AdminSession | null {
  try {
    const secret = process.env.SESSION_SECRET || 'koreanews-session-secret-change-in-production';
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const lastDotIndex = decoded.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const payload = decoded.substring(0, lastDotIndex);
    const signature = decoded.substring(lastDotIndex + 1);

    // 서명 검증
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (signature !== expectedSignature) {
      console.warn('[Auth] Invalid session signature');
      return null;
    }

    const data: AdminSession = JSON.parse(payload);

    // 만료 시간 확인
    if (Date.now() > data.expiresAt) {
      console.warn('[Auth] Session expired');
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Auth] Token verification error:', error);
    return null;
  }
}

/**
 * CSRF 토큰 생성
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 관리자 인증 확인 미들웨어
 * API 라우트에서 사용: const authResult = await verifyAdminAuth(request);
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  error?: string;
  session?: AdminSession;
}> {
  try {
    // 1. 세션 쿠키 확인
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return { authenticated: false, error: '인증이 필요합니다' };
    }

    // 2. 세션 토큰 검증
    const session = verifySessionToken(sessionCookie.value);
    if (!session || !session.authenticated) {
      return { authenticated: false, error: '세션이 만료되었습니다' };
    }

    // 3. CSRF 토큰 검증 (POST, PUT, DELETE, PATCH 요청만)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfHeader = request.headers.get('X-CSRF-Token');
      const csrfCookie = cookieStore.get(CSRF_COOKIE);

      if (!csrfHeader || !csrfCookie?.value || csrfHeader !== csrfCookie.value) {
        // 개발 환경에서는 CSRF 검증 경고만
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Auth] CSRF token mismatch (development mode - skipping)');
        } else {
          return { authenticated: false, error: 'CSRF 토큰이 유효하지 않습니다' };
        }
      }
    }

    return { authenticated: true, session };
  } catch (error) {
    console.error('[Auth] Verification error:', error);
    return { authenticated: false, error: '인증 처리 중 오류가 발생했습니다' };
  }
}

/**
 * 인증 실패 응답 생성
 */
export function unauthorizedResponse(message: string = '인증이 필요합니다'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: 'UNAUTHORIZED',
      message,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * 새 관리자 세션 생성
 */
export function createAdminSession(): {
  sessionToken: string;
  csrfToken: string;
  expiresAt: number;
} {
  const expiresAt = Date.now() + SESSION_DURATION;
  const csrfToken = generateCsrfToken();

  const sessionData: AdminSession = {
    authenticated: true,
    timestamp: Date.now(),
    expiresAt,
    csrf: csrfToken,
  };

  const sessionToken = createSessionToken(sessionData);

  return {
    sessionToken,
    csrfToken,
    expiresAt,
  };
}

/**
 * 세션 쿠키 설정 옵션
 */
export function getSessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(expiresAt),
  };
}

/**
 * API 라우트 래퍼 - 인증 필요 핸들러
 * 사용 예:
 * export const GET = withAdminAuth(async (request, session) => {
 *   // 인증된 요청 처리
 * });
 */
export function withAdminAuth<T>(
  handler: (request: NextRequest, session: AdminSession) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { success: false; code: string; message: string; timestamp: string }>> => {
    const authResult = await verifyAdminAuth(request);

    if (!authResult.authenticated || !authResult.session) {
      return unauthorizedResponse(authResult.error) as NextResponse<{ success: false; code: string; message: string; timestamp: string }>;
    }

    return handler(request, authResult.session);
  };
}
