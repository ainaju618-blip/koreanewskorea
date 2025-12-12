import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH: 소스 수정
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        // 허용된 필드만 업데이트
        const allowedFields = ['name', 'type', 'url', 'region', 'category', 'active', 'last_fetched_at', 'articles_count'];
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const { data, error } = await supabaseAdmin
            .from('scraper_sources')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, source: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE: 소스 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('scraper_sources')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: '소스가 삭제되었습니다.' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
