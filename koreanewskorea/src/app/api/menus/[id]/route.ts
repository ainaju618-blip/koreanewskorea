import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH: 메뉴 수정
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();

        const updateData: any = {};
        const allowedFields = ['name', 'type', 'category_id', 'custom_url', 'target', 'parent_id', 'order_index', 'is_mega', 'mega_columns', 'icon', 'highlight', 'is_active'];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const { data, error } = await supabaseAdmin
            .from('menus')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, menu: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE: 메뉴 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('menus')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: '삭제되었습니다.' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
