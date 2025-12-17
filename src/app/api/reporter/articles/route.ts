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

        // Validate accessibleRegions - filter out null/undefined/non-string values
        const validRegions = accessibleRegions?.filter(r => typeof r === 'string' && r.trim() !== '') || [];

        // Status filter
        const statusFilter = searchParams.get('status');

        let query = supabaseAdmin
            .from('posts')
            .select('id, title, source, category, published_at, created_at, status, author_id, thumbnail_url, rejection_reason, last_edited_by, last_edited_at, original_url', { count: 'exact' });

        // Apply status filter if provided
        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        // 필터 적용
        if (filter === 'my-region') {
            // 내 권한 범위 기사만
            if (accessibleRegions === null) {
                // 주필: 전체 (필터 없음)
            } else if (validRegions.length === 0) {
                // No valid regions - return empty result
                return NextResponse.json({
                    articles: [],
                    pagination: { page, limit, total: 0, totalPages: 0 },
                    reporter: {
                        id: reporter.id,
                        position: reporter.position,
                        region: reporter.region,
                        regionGroup: getRegionGroupLabel(reporter.position, reporter.region),
                        accessibleRegions: validRegions,
                        access_level: reporter.access_level,
                    },
                });
            } else if (validRegions.length === 1) {
                // 단일 지역
                query = query.eq('source', validRegions[0]);
            } else {
                // 여러 지역 (광주권역 or 전남권역)
                query = query.in('source', validRegions);
            }
        } else if (filter === 'my-articles') {
            // 내가 작성한 기사만
            query = query.eq('author_id', reporter.id);
        } else {
            // 'all' filter: show articles in accessible regions + my articles
            // Use .in() for regions to avoid encoding issues with Korean characters in .or()
            if (accessibleRegions === null) {
                // Editor-in-chief: full access (no filter)
            } else if (validRegions.length === 0) {
                // No valid regions - show only my articles
                query = query.eq('author_id', reporter.id);
            } else {
                // For single or multiple regions: use .in() for regions
                // Then we'll include author's articles in post-processing if needed
                query = query.in('source', validRegions);
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

        // Get author names for articles that have author_id
        const authorIds = [...new Set(articles?.filter(a => a.author_id).map(a => a.author_id) || [])];
        let authorMap: Record<string, string> = {};

        if (authorIds.length > 0) {
            const { data: authors } = await supabaseAdmin
                .from('reporters')
                .select('id, name')
                .in('id', authorIds);

            if (authors) {
                authorMap = Object.fromEntries(authors.map(a => [a.id, a.name]));
            }
        }

        // Add permission info and author_name
        const articlesWithPermission = articles?.map(article => ({
            ...article,
            author_name: article.author_id ? authorMap[article.author_id] || null : null,
            canEdit: canEditArticle(
                { id: reporter.id, position: reporter.position || '', region: reporter.region || '' },
                { source: article.source || '', author_id: article.author_id }
            ),
        })) || [];

        // 지역 그룹 라벨
        const regionGroupLabel = getRegionGroupLabel(reporter.position || '', reporter.region || '');

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
                access_level: reporter.access_level,
            },
        });

    } catch (error: unknown) {
        console.error('GET /api/reporter/articles error:', error);

        // Handle different error types
        let message = 'Server error';
        let errorDetails: Record<string, unknown> = {};

        if (error instanceof Error) {
            message = error.message;
            errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 500)
            };
        } else if (error && typeof error === 'object') {
            // Supabase PostgrestError is not an Error instance
            const supaError = error as Record<string, unknown>;
            message = (supaError.message as string) || (supaError.details as string) || 'Database error';
            errorDetails = {
                code: supaError.code,
                message: supaError.message,
                details: supaError.details,
                hint: supaError.hint,
                full: JSON.stringify(error)
            };
        } else {
            message = String(error);
            errorDetails = { raw: String(error) };
        }

        return NextResponse.json({
            message,
            _error: errorDetails
        }, { status: 500 });
    }
}
