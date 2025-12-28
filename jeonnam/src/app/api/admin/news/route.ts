
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Admin 기능을 위해 Service Role Key 사용 필수
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { id, action } = await request.json();

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
        }

        if (action === 'approve') {
            const { error } = await supabase
                .from('posts')
                .update({ status: 'published', published_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Article approved' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const force = searchParams.get('force') === 'true';

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        let error;

        if (force) {
            // Hard Delete (Permanent)
            const res = await supabase
                .from('posts')
                .delete()
                .eq('id', id);
            error = res.error;
        } else {
            // Soft Delete (Move to Trash)
            const res = await supabase
                .from('posts')
                .update({ status: 'trash' })
                .eq('id', id);
            error = res.error;
        }

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: force ? 'Article permanently deleted' : 'Article moved to trash'
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// 기사 업데이트 (편집 저장)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, subtitle, content, category, ai_summary, thumbnail_url, status, is_focus } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        // 제공된 필드만 업데이트
        if (title !== undefined) updateData.title = title;
        if (subtitle !== undefined) updateData.subtitle = subtitle;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (ai_summary !== undefined) updateData.ai_summary = ai_summary;
        if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
        if (is_focus !== undefined) updateData.is_focus = is_focus;
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'published') {
                updateData.published_at = new Date().toISOString();
            }
        }

        const { error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Article updated' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
