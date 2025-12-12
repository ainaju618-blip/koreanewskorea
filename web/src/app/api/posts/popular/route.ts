import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET /api/posts/popular - 인기 기사 Top 10 조회
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('posts')
            .select('id, title, category, view_count, published_at, thumbnail_url')
            .eq('status', 'published')
            .order('view_count', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Popular posts fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: data || []
        });

    } catch (error: any) {
        console.error('Popular posts error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
