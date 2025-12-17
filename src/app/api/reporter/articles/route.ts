import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
    getAccessibleRegions,
    getAccessibleRegionsMulti,
    canEditArticle,
    canEditArticleMulti,
    getRegionGroupLabel,
    getRegionGroupLabelMulti
} from '@/lib/regions';

/**
 * GET /api/reporter/articles
 * Reporter article list with position/region-based permission filtering
 *
 * Permission hierarchy:
 * - Editor-in-chief: full access
 * - Gwangju branch manager: Gwangju region (city, education office, 5 districts)
 * - Jeonnam branch manager: Jeonnam region (province, education office, 22 cities/counties)
 * - City/county branch manager: assigned city/county only
 * - Others: assigned regions only
 *
 * Supports multi-region via reporter_regions junction table
 *
 * Query Params:
 * - filter: 'all' | 'my-region' | 'my-articles'
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
export async function GET(req: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: 'Login required' },
                { status: 401 }
            );
        }

        // Get reporter info
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: 'Reporter not found' },
                { status: 404 }
            );
        }

        // Get regions from junction table (multi-region support)
        const { data: reporterRegions } = await supabaseAdmin
            .from('reporter_regions')
            .select('region')
            .eq('reporter_id', reporter.id);

        // Extract region strings from junction table, fallback to single region
        const assignedRegions: string[] = reporterRegions && reporterRegions.length > 0
            ? reporterRegions.map(r => r.region)
            : (reporter.region ? [reporter.region] : []);

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Get accessible regions (supports multi-region)
        const accessibleRegions = assignedRegions.length > 1
            ? getAccessibleRegionsMulti(reporter.position, assignedRegions)
            : getAccessibleRegions(reporter.position, reporter.region);

        // Validate accessibleRegions - filter out null/undefined/non-string values
        const validRegions = accessibleRegions?.filter(r => typeof r === 'string' && r.trim() !== '') || [];

        // Status filter
        const statusFilter = searchParams.get('status');

        let query = supabaseAdmin
            .from('posts')
            .select('id, title, source, category, published_at, created_at, status, author_id, thumbnail_url, rejection_reason, last_edited_by, last_edited_at', { count: 'exact' });

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

        // Add permission info and author_name (supports multi-region)
        const useMultiRegion = assignedRegions.length > 1;
        const articlesWithPermission = articles?.map(article => ({
            ...article,
            author_name: article.author_id ? authorMap[article.author_id] || null : null,
            canEdit: useMultiRegion
                ? canEditArticleMulti(
                    { id: reporter.id, position: reporter.position || '', regions: assignedRegions },
                    { source: article.source || '', author_id: article.author_id }
                )
                : canEditArticle(
                    { id: reporter.id, position: reporter.position || '', region: reporter.region || '' },
                    { source: article.source || '', author_id: article.author_id }
                ),
        })) || [];

        // Region group label (supports multi-region)
        const regionGroupLabel = useMultiRegion
            ? getRegionGroupLabelMulti(reporter.position || '', assignedRegions)
            : getRegionGroupLabel(reporter.position || '', reporter.region || '');

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
                regions: assignedRegions,
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
