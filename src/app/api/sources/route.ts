import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 수집처 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabaseAdmin
            .from('news_sources')
            .select('*')
            .order('region', { ascending: true })
            .order('org_type', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            console.error('수집처 조회 오류:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ sources: data || [] });
    } catch (error: any) {
        console.error('API 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: 신규 수집처 추가
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 필수 필드 검증
        if (!body.name || !body.code) {
            return NextResponse.json(
                { error: '기관명과 영문 코드는 필수입니다.' },
                { status: 400 }
            );
        }

        // 코드 중복 체크
        const { data: existing } = await supabaseAdmin
            .from('news_sources')
            .select('id')
            .eq('code', body.code)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: '이미 존재하는 코드입니다.' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('news_sources')
            .insert({
                name: body.name,
                code: body.code,
                region: body.region || '전남',
                org_type: body.org_type || '군',
                homepage_url: body.homepage_url || '',
                press_list_url: body.press_list_url || '',
                press_detail_pattern: body.press_detail_pattern || null,
                main_phone: body.main_phone || null,
                contact_dept: body.contact_dept || null,
                contact_name: body.contact_name || null,
                contact_phone: body.contact_phone || null,
                contact_email: body.contact_email || null,
                scraper_status: body.scraper_status || 'none',
                tech_notes: body.tech_notes || null
            })
            .select()
            .single();

        if (error) {
            console.error('수집처 추가 오류:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ source: data, message: '추가되었습니다.' });
    } catch (error: any) {
        console.error('API 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
