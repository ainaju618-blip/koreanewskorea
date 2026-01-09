/**
 * 관리자 인증 유틸리티
 * ===================
 * 서버 사이드 API 보호를 위한 인증 로직
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// 환경 변수
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'korea-news-admin-secret-key-2024'
);
const TOKEN_NAME = 'admin_token';
const TOKEN_EXPIRY = '24h';

// 관리자 세션 타입
export interface AdminSession {
  authenticated: boolean;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  exp: number;
  iat: number;
}

/**
 * JWT 토큰 생성
 */
export async function createAdminToken(role: AdminSession['role'] = 'admin'): Promise<string> {
  const token = await new SignJWT({
    authenticated: true,
    role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * JWT 토큰 검증
 */
export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

/**
 * 비밀번호 검증 및 토큰 발급
 */
export async function authenticateAdmin(password: string): Promise<{
  success: boolean;
  token?: string;
  message?: string;
}> {
  // 브루트포스 방지를 위한 지연 (실제 환경에서는 rate limiting 추가 권장)
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (password !== ADMIN_PASSWORD) {
    return { success: false, message: '비밀번호가 올바르지 않습니다.' };
  }

  const token = await createAdminToken('super_admin');
  return { success: true, token };
}

/**
 * 쿠키에서 관리자 세션 가져오기 (서버 컴포넌트용)
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) return null;

  return verifyAdminToken(token);
}

/**
 * API 라우트 인증 미들웨어
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, session: AdminSession) => Promise<NextResponse>
): Promise<NextResponse> {
  // Authorization 헤더에서 토큰 확인
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // 쿠키에서 토큰 확인
  if (!token) {
    token = request.cookies.get(TOKEN_NAME)?.value || null;
  }

  if (!token) {
    return NextResponse.json(
      { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const session = await verifyAdminToken(token);

  if (!session) {
    return NextResponse.json(
      { error: '세션이 만료되었습니다.', code: 'SESSION_EXPIRED' },
      { status: 401 }
    );
  }

  return handler(request, session);
}

/**
 * 권한 검사 헬퍼
 */
export function hasPermission(
  session: AdminSession,
  requiredRole: AdminSession['role']
): boolean {
  const roleHierarchy: Record<AdminSession['role'], number> = {
    super_admin: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
  };

  return roleHierarchy[session.role] >= roleHierarchy[requiredRole];
}

/**
 * 특정 권한 필요 미들웨어
 */
export async function withAdminRole(
  request: NextRequest,
  requiredRole: AdminSession['role'],
  handler: (request: NextRequest, session: AdminSession) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAdminAuth(request, async (req, session) => {
    if (!hasPermission(session, requiredRole)) {
      return NextResponse.json(
        { error: '권한이 부족합니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    return handler(req, session);
  });
}

/**
 * 로그인 응답에 토큰 쿠키 설정
 */
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24시간
    path: '/',
  });
  return response;
}

/**
 * 로그아웃 - 쿠키 삭제
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete(TOKEN_NAME);
  return response;
}
