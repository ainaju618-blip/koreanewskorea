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
        const category = searchParams.get('category'); // ★ 카테고리 필터

        // Calculate Range
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact' }) // Get total count
            .order(sortField, { ascending: false })
            .range(start, end);

        // 상태 필터
        // - 'published': 메인 노출 가능 (이미지+본문+제목)
        // - 'draft': 게시판만 노출 (본문+제목)
        // - 'hidden': 어디에도 안 나옴 (제목만)
        // - 'visible': published + draft (게시판에서 사용)
        if (status === 'visible') {
            // 게시판용: published 또는 draft 상태의 기사
            query = query.in('status', ['published', 'draft']);
        } else if (status && status !== 'all') {
            query = query.eq('status', status);
        } else {
            // 기본값: hidden 제외 (published + draft)
            query = query.neq('status', 'hidden');
        }

        // ★ 이미지 필수 필터 (메인 페이지용)
        if (requireImage) {
            query = query
                .not('thumbnail_url', 'is', null)  // null 제외
                .neq('thumbnail_url', '')          // 빈 문자열 제외
                .like('thumbnail_url', 'http%');   // http로 시작하는 URL만
        }

        // ★ 카테고리 필터 (관리자 GNB 메뉴용)
        if (category) {
            query = query.eq('category', category);
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
