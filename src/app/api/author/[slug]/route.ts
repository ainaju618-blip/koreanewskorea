import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/author/[slug]
 * 기자 프로필 및 작성 기사 목록 조회 (공개 API)
 * slug 또는 id 지원
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // 1. 기자 정보 조회
        let query = supabaseAdmin
            .from('reporters')
            .select('*') // 모든 필드 조회 (확장된 E-E-A-T 필드 포함)
            .eq('status', 'Active');

        if (UUID_REGEX.test(slug)) {
            query = query.eq('id', slug);
        } else {
            query = query.eq('slug', slug);
        }

        const { data: reporter, error: reporterError } = await query.single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 2. 구독 정보 조회 (로그인 유저인 경우)
        let isSubscribed = false;
        try {
            const supabase = await createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: sub } = await supabase
                    .from('reporter_subscriptions')
                    .select('id')
                    .eq('subscriber_id', session.user.id)
                    .eq('reporter_id', reporter.id)
                    .single();
                isSubscribed = !!sub;
            }
        } catch (authError) {
            console.error('Auth check error:', authError);
            // 인증 에러나도 기자 정보는 보여줘야 함
        }

        // 3. 기자가 작성한 기사 조회 (published 상태만)
        // Query by user_id (primary) or author_name (fallback)
        let articlesQuery = supabaseAdmin
            .from('posts')
            .select('id, title, source, category, thumbnail_url, published_at, view_count', { count: 'exact' })
            .eq('status', 'published');

        if (reporter.user_id) {
            // Primary: match by user_id, fallback: match by author_name
            articlesQuery = articlesQuery.or(`author_id.eq.${reporter.user_id},author_name.eq.${reporter.name}`);
        } else {
            // No user_id linked, match by author_name only
            articlesQuery = articlesQuery.eq('author_name', reporter.name);
        }

        const { data: articles, error: articlesError, count } = await articlesQuery
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
                ...reporter,
                is_subscribed: isSubscribed
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
