import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Disable caching - always fetch fresh data from DB
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Category tree
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const flat = searchParams.get('flat') === 'true';
        const activeOnly = searchParams.get('active') !== 'false';
        const gnbOnly = searchParams.get('gnb') === 'true';

        let query = supabaseAdmin
            .from('categories')
            .select('*')
            .order('depth', { ascending: true })
            .order('order_index', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        // GNB용 필터: show_in_gnb=true인 것만
        if (gnbOnly) {
            query = query.eq('show_in_gnb', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        // flat=true면 평면 배열 반환
        if (flat) {
            return NextResponse.json({ categories: data, flat: data });
        }

        // 트리 구조로 변환
        const tree = buildTree(data || []);
        return NextResponse.json({ categories: tree, flat: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: 카테고리 생성
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, slug, parent_id, description, icon, color, scraper_slug, custom_url, link_target, show_in_gnb, show_in_main } = body;

        if (!name || !slug) {
            return NextResponse.json({ message: '이름과 슬러그는 필수입니다.' }, { status: 400 });
        }

        // 부모 카테고리 정보 조회
        let depth = 0;
        let path = slug;
        if (parent_id) {
            const { data: parent } = await supabaseAdmin
                .from('categories')
                .select('depth, path')
                .eq('id', parent_id)
                .single();

            if (parent) {
                depth = parent.depth + 1;
                path = `${parent.path}/${slug}`;
            }
        }

        // 같은 레벨의 마지막 순서 조회
        let orderQuery = supabaseAdmin
            .from('categories')
            .select('order_index')
            .order('order_index', { ascending: false })
            .limit(1);

        // parent_id가 빈 문자열이면 null로 처리
        if (parent_id) {
            orderQuery = orderQuery.eq('parent_id', parent_id);
        } else {
            orderQuery = orderQuery.is('parent_id', null);
        }

        const { data: lastItem } = await orderQuery.maybeSingle();

        const order_index = (lastItem?.order_index ?? -1) + 1;

        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert({
                name,
                slug,
                description,
                parent_id: parent_id || null,
                depth,
                path,
                order_index,
                icon,
                color: color || '#3B82F6',
                scraper_slug: scraper_slug || null,
                custom_url: custom_url || null,
                link_target: link_target || '_self',
                show_in_gnb: show_in_gnb !== false,
                show_in_main: show_in_main !== false,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, category: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// 트리 구조 빌드 헬퍼
function buildTree(items: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    items.forEach(item => {
        map.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
        if (item.parent_id && map.has(item.parent_id)) {
            map.get(item.parent_id).children.push(map.get(item.id));
        } else {
            roots.push(map.get(item.id));
        }
    });

    return roots;
}
