import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 단일 수집처 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('news_sources')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('수집처 조회 오류:', error);
            return NextResponse.json({ error: '수집처를 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ source: data });
    } catch (error: any) {
        console.error('API 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: 수집처 수정
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // 업데이트할 필드만 추출
        const updateData: Record<string, any> = {};
        const allowedFields = [
            'name', 'code', 'region', 'org_type',
            'homepage_url', 'press_list_url', 'press_detail_pattern',
            'main_phone', 'contact_dept', 'contact_name', 'contact_phone', 'contact_email',
            'scraper_status', 'tech_notes'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // 코드 변경 시 중복 체크
        if (updateData.code) {
            const { data: existing } = await supabaseAdmin
                .from('news_sources')
                .select('id')
                .eq('code', updateData.code)
                .neq('id', id)
                .single();

            if (existing) {
                return NextResponse.json(
                    { error: '이미 존재하는 코드입니다.' },
                    { status: 400 }
                );
            }
        }

        const { data, error } = await supabaseAdmin
            .from('news_sources')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('수집처 수정 오류:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ source: data, message: '수정되었습니다.' });
    } catch (error: any) {
        console.error('API 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: 수집처 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('news_sources')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('수집처 삭제 오류:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: '삭제되었습니다.' });
    } catch (error: any) {
        console.error('API 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
