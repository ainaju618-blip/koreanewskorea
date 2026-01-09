import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, verifyAdminToken, setAuthCookie, clearAuthCookie } from '@/lib/admin-auth';

const TOKEN_NAME = 'admin_token';

/**
 * POST /api/admin/auth
 * 관리자 비밀번호 검증 및 JWT 토큰 발급
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.', code: 'PASSWORD_REQUIRED' },
        { status: 400 }
      );
    }

    const result = await authenticateAdmin(password);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { error: result.message || '인증 실패', code: 'AUTH_FAILED' },
        { status: 401 }
      );
    }

    // JWT 토큰을 httpOnly 쿠키로 설정
    const response = NextResponse.json({
      success: true,
      message: '인증 성공',
    });

    return setAuthCookie(response, result.token);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auth
 * 세션 유효성 확인
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더 또는 쿠키에서 토큰 확인
    const authHeader = request.headers.get('Authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      token = request.cookies.get(TOKEN_NAME)?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { authenticated: false, code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const session = await verifyAdminToken(token);

    if (!session) {
      const response = NextResponse.json(
        { authenticated: false, error: '세션이 만료되었습니다.', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
      return clearAuthCookie(response);
    }

    return NextResponse.json({
      authenticated: true,
      role: session.role,
      expiresAt: session.exp * 1000, // Unix timestamp to ms
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * 로그아웃 (쿠키 삭제)
 */
export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: '로그아웃 완료',
    });
    return clearAuthCookie(response);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
