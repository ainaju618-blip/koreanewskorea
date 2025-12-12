import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/author/[id]
 * 기자 프로필 및 작성 기사 목록 조회 (공개 API)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('id, name, position, region, bio, avatar_icon, type, created_at')
            .eq('id', id)
            .eq('status', 'Active')
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 기자가 작성한 기사 조회 (published 상태만)
        const { data: articles, error: articlesError, count } = await supabaseAdmin
            .from('posts')
            .select('id, title, source, category, thumbnail_url, published_at', { count: 'exact' })
            .eq('author_id', id)
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (articlesError) {
            console.error('Articles fetch error:', articlesError);
        }

        // 총 기사 수
        const totalArticles = count || 0;
        const totalPages = Math.ceil(totalArticles / limit);

        return NextResponse.json({
            reporter: {
                id: reporter.id,
                name: reporter.name,
                position: reporter.position,
                region: reporter.region,
                bio: reporter.bio,
                avatar_icon: reporter.avatar_icon,
                type: reporter.type,
                joined_at: reporter.created_at,
            },
            articles: articles || [],
            pagination: {
                page,
                limit,
                total: totalArticles,
                totalPages,
            },
        });

    } catch (error: unknown) {
        console.error('Get author error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
