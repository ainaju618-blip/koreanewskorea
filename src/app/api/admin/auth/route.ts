import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/auth
 * 관리자 비밀번호 검증 API
 * 
 * 환경변수 ADMIN_PASSWORD로 비밀번호 설정
 * 기본값: koreanews2024!
 */
export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json(
                { message: '비밀번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 환경변수에서 비밀번호 가져오기 (설정 안 되어 있으면 기본값 사용)
        const adminPassword = process.env.ADMIN_PASSWORD || 'a123456789!';

        if (password === adminPassword) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { message: '비밀번호가 올바르지 않습니다.' },
                { status: 401 }
            );
        }
    } catch (error: unknown) {
        console.error('Admin auth error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
