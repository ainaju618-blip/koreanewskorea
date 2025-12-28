import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/posts/stats/by-region
 * 지역별 기사 통계 조회
 *
 * Response:
 * {
 *   stats: [
 *     { source: "여수시", count: 15, latestDate: "2025-12-12" },
 *     { source: "순천시", count: 23, latestDate: "2025-12-11" }
 *   ],
 *   total: 38
 * }
 */
export async function GET(req: NextRequest) {
    try {
        // 지역(source)별 기사 수 집계 - PostgreSQL RPC 또는 직접 쿼리
        // Supabase에서 group by를 위해 rpc 또는 raw SQL 사용

        const { data, error } = await supabaseAdmin
            .rpc('get_posts_stats_by_region');

        if (error) {
            // RPC가 없으면 직접 쿼리로 fallback
            console.log('RPC not found, using direct query fallback');

            // Get all posts with increased limit to avoid 1000 row default
            const { data: posts, error: fetchError } = await supabaseAdmin
                .from('posts')
                .select('source, published_at')
                .order('published_at', { ascending: false })
                .limit(50000);

            if (fetchError) throw fetchError;

            // source별로 그룹화
            const statsMap: Record<string, { count: number; latestDate: string | null }> = {};

            posts?.forEach(post => {
                const source = post.source || '기타';
                if (!statsMap[source]) {
                    statsMap[source] = { count: 0, latestDate: null };
                }
                statsMap[source].count++;
                if (!statsMap[source].latestDate && post.published_at) {
                    statsMap[source].latestDate = post.published_at.split('T')[0];
                }
            });

            const stats = Object.entries(statsMap).map(([source, data]) => ({
                source,
                count: data.count,
                latestDate: data.latestDate
            }));

            // 기사 수 내림차순 정렬
            stats.sort((a, b) => b.count - a.count);

            const total = stats.reduce((sum, s) => sum + s.count, 0);

            return NextResponse.json({ stats, total });
        }

        // RPC 성공 시
        const total = data?.reduce((sum: number, s: any) => sum + s.count, 0) || 0;
        return NextResponse.json({ stats: data, total });

    } catch (error: any) {
        console.error('GET /api/posts/stats/by-region error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
