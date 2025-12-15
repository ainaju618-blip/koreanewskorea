import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/reporter/reporters
 * 기자 목록 조회 (기자 변경 시 선택용)
 * 권한: access_level >= 2 (지사장 이상)
 */
export async function GET(req: NextRequest) {
    try {
        // 인증 확인
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 기자 정보 조회
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

        // 기자 변경 권한 확인 (access_level >= 2: 지사장 이상)
        if (reporter.access_level < 2) {
            return NextResponse.json(
                { message: '기자 목록 조회 권한이 없습니다.' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const region = searchParams.get('region');

        // 기자 목록 조회
        let query = supabaseAdmin
            .from('reporters')
            .select('id, name, email, region, position, access_level')
            .eq('status', 'approved')
            .order('name');

        // 특정 지역 필터
        if (region) {
            query = query.eq('region', region);
        }

        const { data: reporters, error } = await query;

        if (error) {
            console.error('Reporters query error:', error);
            throw error;
        }

        return NextResponse.json({
            reporters: reporters || [],
        });

    } catch (error: unknown) {
        console.error('GET /api/reporter/reporters error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
