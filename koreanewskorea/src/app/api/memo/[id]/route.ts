import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/memo/[id]
 * 단일 메모 조회 (본인 메모만)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // 인증 확인
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('memos')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ message: '메모를 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * PUT /api/memo/[id]
 * 메모 수정 (본인 메모만)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

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
            .update({
                title: body.title,
                content: body.content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * DELETE /api/memo/[id]
 * 메모 삭제 (본인 메모만)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // 인증 확인
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        const { error } = await supabaseAdmin
            .from('memos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ message: '메모가 삭제되었습니다.' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
