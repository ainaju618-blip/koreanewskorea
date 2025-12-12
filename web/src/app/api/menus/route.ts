import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 메뉴 목록 조회
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get('active') !== 'false';

        let query = supabaseAdmin
            .from('menus')
            .select(`
                *,
                category:categories(id, name, slug, color, icon)
            `)
            .order('order_index', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        // 메가메뉴인 경우, 연결된 카테고리의 하위 카테고리 조회
        const menusWithChildren = await Promise.all(
            (data || []).map(async (menu) => {
                if (menu.is_mega && menu.category_id) {
                    // 해당 카테고리의 하위 카테고리 조회
                    const { data: children } = await supabaseAdmin
                        .from('categories')
                        .select('id, name, slug, color, icon')
                        .eq('parent_id', menu.category_id)
                        .eq('is_active', true)
                        .order('order_index', { ascending: true });

                    return {
                        ...menu,
                        category: menu.category ? {
                            ...menu.category,
                            children: children || []
                        } : null
                    };
                }
                return menu;
            })
        );

        // 트리 구조로 변환 (1단계 하위메뉴만 지원)
        const roots = menusWithChildren.filter(m => !m.parent_id);
        const tree = roots.map(menu => ({
            ...menu,
            children: menusWithChildren.filter(m => m.parent_id === menu.id)
        }));

        return NextResponse.json({ menus: tree, flat: menusWithChildren });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: 메뉴 생성
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, type, category_id, custom_url, target, parent_id, is_mega, mega_columns, icon, highlight } = body;

        if (!name || !type) {
            return NextResponse.json({ message: '이름과 타입은 필수입니다.' }, { status: 400 });
        }

        // 마지막 순서 조회
        const { data: lastItem } = await supabaseAdmin
            .from('menus')
            .select('order_index')
            .is('parent_id', parent_id || null)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const order_index = (lastItem?.order_index ?? -1) + 1;

        const { data, error } = await supabaseAdmin
            .from('menus')
            .insert({
                name,
                type,
                category_id: category_id || null,
                custom_url: custom_url || null,
                target: target || '_self',
                parent_id: parent_id || null,
                order_index,
                is_mega: is_mega || false,
                mega_columns: mega_columns || 2,
                icon,
                highlight: highlight || false,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, menu: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
