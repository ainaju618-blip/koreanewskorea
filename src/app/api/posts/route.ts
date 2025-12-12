import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/posts - 기사 목록 조회
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        // Page & Limit (Default: Page 1, Limit 20)
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const requireImage = searchParams.get('requireImage') === 'true'; // ★ 이미지 필수 여부

        const sort = searchParams.get('sort') || 'published_at';
        const sortField = sort === 'created_at' ? 'created_at' : 'published_at';

        // Calculate Range
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact' }) // Get total count
            .order(sortField, { ascending: false })
            .range(start, end);

        // 상태 필터 (옵션)
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // ★ 이미지 필수 필터 (메인 페이지용)
        if (requireImage) {
            query = query.not('thumbnail_url', 'is', null);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            posts: data,
            count: count || 0,
            page,
            totalPages: count ? Math.ceil(count / limit) : 0
        });
    } catch (error: any) {
        console.error('GET /api/posts error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/posts - 기사 생성 (봇 또는 관리자 직접 작성용)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('posts')
            .insert({
                title: body.title,
                content: body.content,
                status: body.status || 'draft',
                category: body.category,
                source: body.source,
                original_link: body.original_link,
                thumbnail_url: body.thumbnail_url,
                published_at: body.published_at || new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/posts error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
