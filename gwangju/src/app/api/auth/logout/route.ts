import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/auth/logout
 * 로그아웃 API
 */
export async function POST() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();

        return NextResponse.json({ message: '로그아웃되었습니다.' });
    } catch (error: unknown) {
        console.error('Logout error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
