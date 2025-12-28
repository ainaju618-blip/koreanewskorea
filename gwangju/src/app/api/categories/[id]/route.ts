import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH: Update category
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, slug, description, icon, color, scraper_slug, custom_url, link_target, is_active, show_in_gnb, show_in_main } = body;

        const updateData: any = { updated_at: new Date().toISOString() };

        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (color !== undefined) updateData.color = color;
        if (scraper_slug !== undefined) updateData.scraper_slug = scraper_slug;
        if (custom_url !== undefined) updateData.custom_url = custom_url || null;
        if (link_target !== undefined) updateData.link_target = link_target;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (show_in_gnb !== undefined) updateData.show_in_gnb = show_in_gnb;
        if (show_in_main !== undefined) updateData.show_in_main = show_in_main;

        const { data, error } = await supabaseAdmin
            .from('categories')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Hierarchical inheritance: when parent GNB OFF, cascade to all children
        if (show_in_gnb === false) {
            await cascadeGnbOffToChildren(id);
        }

        // Hierarchical inheritance: when parent is_active OFF, cascade to all children
        if (is_active === false) {
            await cascadeActiveOffToChildren(id);
        }

        return NextResponse.json({ success: true, category: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// Recursively set show_in_gnb=false for all descendants
async function cascadeGnbOffToChildren(parentId: string) {
    // Find all direct children
    const { data: children } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('parent_id', parentId);

    if (!children || children.length === 0) return;

    // Update all children to show_in_gnb=false
    const childIds = children.map(c => c.id);
    await supabaseAdmin
        .from('categories')
        .update({ show_in_gnb: false, updated_at: new Date().toISOString() })
        .in('id', childIds);

    // Recursively process grandchildren
    for (const child of children) {
        await cascadeGnbOffToChildren(child.id);
    }
}

// Recursively set is_active=false for all descendants
async function cascadeActiveOffToChildren(parentId: string) {
    const { data: children } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('parent_id', parentId);

    if (!children || children.length === 0) return;

    const childIds = children.map(c => c.id);
    await supabaseAdmin
        .from('categories')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('id', childIds);

    for (const child of children) {
        await cascadeActiveOffToChildren(child.id);
    }
}

// DELETE: 카테고리 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // 하위 카테고리가 있는지 확인
        const { data: children } = await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('parent_id', id);

        if (children && children.length > 0) {
            return NextResponse.json(
                { message: '하위 카테고리가 있어 삭제할 수 없습니다. 하위 카테고리를 먼저 삭제하세요.' },
                { status: 400 }
            );
        }

        // 해당 카테고리 기사 수 확인
        const { count } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', id);

        if (count && count > 0) {
            // 기사가 있으면 category_id를 null로 변경
            await supabaseAdmin
                .from('posts')
                .update({ category_id: null })
                .eq('category_id', id);
        }

        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: '삭제되었습니다.' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
