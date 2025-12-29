import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/memo
 * 메모 목록 조회
 * - admin=true: 전체 메모 조회 (관리자용)
 * - 기본: 본인 메모만 조회 (기자용)
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

        const { searchParams } = new URL(req.url);
        const isAdmin = searchParams.get('admin') === 'true';

        let query = supabaseAdmin
            .from('memos')
            .select('*')
            .order('updated_at', { ascending: false });

        // 관리자가 아니면 본인 메모만 조회
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: unknown) {
        console.error('GET /api/memo error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * POST /api/memo
 * 새 메모 생성 (본인 소유로)
 */
export async function POST(req: NextRequest) {
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

        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('memos')
            .insert([{
                title: body.title || '새 메모',
                content: body.content || '',
                user_id: user.id,
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('POST /api/memo error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
