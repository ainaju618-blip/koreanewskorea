import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 소스 목록 조회
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const active = searchParams.get('active'); // 'true', 'false', or null (all)

        let query = supabaseAdmin
            .from('scraper_sources')
            .select('*')
            .order('created_at', { ascending: false });

        if (active === 'true') {
            query = query.eq('active', true);
        } else if (active === 'false') {
            query = query.eq('active', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ sources: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: 신규 소스 추가
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, type, url, region, category, active } = body;

        if (!name || !url) {
            return NextResponse.json(
                { message: '소스명과 URL은 필수 항목입니다.' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('scraper_sources')
            .insert({
                name,
                type: type || 'web',
                url,
                region: region || null,
                category: category || 'local',
                active: active !== false
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, source: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
