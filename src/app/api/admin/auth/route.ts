import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'a123456789!';
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간

/**
 * POST /api/admin/auth
 * 관리자 비밀번호 검증 및 세션 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 세션 토큰 생성
    const sessionToken = Buffer.from(
      JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
      })
    ).toString('base64');

    // 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    });

    return NextResponse.json({ success: true, message: '인증 성공' });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auth
 * 세션 유효성 확인
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      const session = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString()
      );

      if (session.expiresAt < Date.now()) {
        cookieStore.delete(SESSION_COOKIE_NAME);
        return NextResponse.json(
          { authenticated: false, error: '세션이 만료되었습니다.' },
          { status: 401 }
        );
      }

      return NextResponse.json({ authenticated: true });
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/auth
 * 로그아웃 (세션 삭제)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true, message: '로그아웃 완료' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
