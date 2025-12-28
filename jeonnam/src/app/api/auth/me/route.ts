import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/auth/me
 * 현재 로그인한 기자 정보 조회
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // reporters 테이블에서 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user,
            reporter,
        });

    } catch (error: unknown) {
        console.error('Get me error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
