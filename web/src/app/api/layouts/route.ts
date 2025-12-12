import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 레이아웃 조회
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const pageType = searchParams.get('page_type') || 'home';
        const pageSlug = searchParams.get('page_slug');

        let query = supabaseAdmin
            .from('layouts')
            .select('*')
            .eq('page_type', pageType)
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (pageSlug) {
            query = query.eq('page_slug', pageSlug);
        } else {
            query = query.is('page_slug', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ layouts: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: 레이아웃 섹션 추가
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            page_type, page_slug, section_name, section_type,
            source_type, source_category_ids, items_count,
            title, title_icon, show_more_link, more_link_url,
            background, padding
        } = body;

        if (!page_type || !section_name || !section_type || !source_type) {
            return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 });
        }

        // 마지막 순서 조회
        let orderQuery = supabaseAdmin
            .from('layouts')
            .select('order_index')
            .eq('page_type', page_type)
            .order('order_index', { ascending: false })
            .limit(1);

        if (page_slug) {
            orderQuery = orderQuery.eq('page_slug', page_slug);
        } else {
            orderQuery = orderQuery.is('page_slug', null);
        }

        const { data: lastItem } = await orderQuery.single();
        const order_index = (lastItem?.order_index ?? 0) + 1;

        const { data, error } = await supabaseAdmin
            .from('layouts')
            .insert({
                page_type,
                page_slug: page_slug || null,
                section_name,
                section_type,
                source_type,
                source_category_ids: source_category_ids || null,
                order_index,
                items_count: items_count || 4,
                title,
                title_icon,
                show_more_link: show_more_link !== false,
                more_link_url,
                background: background || 'white',
                padding: padding || 'normal',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, layout: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
