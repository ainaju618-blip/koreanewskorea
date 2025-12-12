import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAccessibleRegions, canEditArticle, getRegionGroupLabel } from '@/lib/regions';

/**
 * GET /api/reporter/articles
 * 기자용 기사 목록 조회 (직위/지역 기반 권한 필터링)
 *
 * 권한 체계:
 * - 주필: 전체
 * - 광주지사장: 광주권역 (광주광역시, 광주교육청, 5개구)
 * - 전남지사장: 전남권역 (전라남도, 전남교육청, 22개 시군)
 * - 시군지사장: 해당 시군만
 * - 그 외: 본인 담당 지역만
 *
 * Query Params:
 * - filter: 'all' | 'my-region' | 'my-articles'
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
export async function GET(req: NextRequest) {
    try {
        // 인증 확인
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // 접근 가능한 지역 목록 조회
        const accessibleRegions = getAccessibleRegions(reporter.position, reporter.region);

        let query = supabaseAdmin
            .from('posts')
            .select('id, title, source, category, published_at, status, author_id, thumbnail_url', { count: 'exact' });

        // 필터 적용
        if (filter === 'my-region') {
            // 내 권한 범위 기사만
            if (accessibleRegions === null) {
                // 주필: 전체 (필터 없음)
            } else if (accessibleRegions.length === 1) {
                // 단일 지역
                query = query.eq('source', accessibleRegions[0]);
            } else {
                // 여러 지역 (광주권역 or 전남권역)
                query = query.in('source', accessibleRegions);
            }
        } else if (filter === 'my-articles') {
            // 내가 작성한 기사만
            query = query.eq('author_id', reporter.id);
        } else {
            // 'all' 필터: 권한 범위 내 기사만 표시
            if (accessibleRegions === null) {
                // 주필: 전체 (필터 없음)
            } else if (accessibleRegions.length === 1) {
                // 단일 지역: 해당 지역 + 내가 쓴 기사
                query = query.or(`source.eq.${accessibleRegions[0]},author_id.eq.${reporter.id}`);
            } else {
                // 여러 지역 (광주권역 or 전남권역)
                const regionFilter = accessibleRegions.map(r => `source.eq.${r}`).join(',');
                query = query.or(`${regionFilter},author_id.eq.${reporter.id}`);
            }
        }

        // 정렬 및 페이지네이션
        query = query
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: articles, error, count } = await query;

        if (error) {
            console.error('Articles query error:', error);
            throw error;
        }

        // 권한 정보 추가
        const articlesWithPermission = articles?.map(article => ({
            ...article,
            canEdit: canEditArticle(
                { id: reporter.id, position: reporter.position, region: reporter.region },
                article
            ),
        })) || [];

        // 지역 그룹 라벨
        const regionGroupLabel = getRegionGroupLabel(reporter.position, reporter.region);

        return NextResponse.json({
            articles: articlesWithPermission,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
            reporter: {
                id: reporter.id,
                position: reporter.position,
                region: reporter.region,
                regionGroup: regionGroupLabel,
                accessibleRegions: accessibleRegions,
            },
        });

    } catch (error: unknown) {
        console.error('GET /api/reporter/articles error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
