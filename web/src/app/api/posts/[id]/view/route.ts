import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 현재 조회수 조회
        const { data: post, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('view_count')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // 조회수 증가
        const newViewCount = (post.view_count || 0) + 1;
        const { error: updateError } = await supabaseAdmin
            .from('posts')
            .update({ view_count: newViewCount })
            .eq('id', id);

        if (updateError) {
            console.error('View count update error:', updateError);
            return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            view_count: newViewCount
        });

    } catch (error: any) {
        console.error('View count error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
