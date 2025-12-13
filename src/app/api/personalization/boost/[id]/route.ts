import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT: 부스트 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // 시간 검증 (시작/종료 시간이 변경되는 경우)
        if (body.start_at && body.end_at) {
            if (new Date(body.start_at) >= new Date(body.end_at)) {
                return NextResponse.json(
                    { error: '시작 시간은 종료 시간보다 이전이어야 합니다' },
                    { status: 400 }
                );
            }
        }

        // 우선순위 검증
        if (body.priority && (body.priority < 1 || body.priority > 10)) {
            return NextResponse.json(
                { error: '우선순위는 1~10 범위' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('boost_schedules')
            .update(body)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PUT boost error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: 부스트 삭제 (Soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('boost_schedules')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE boost error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
