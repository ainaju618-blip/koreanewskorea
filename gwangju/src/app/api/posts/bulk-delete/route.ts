import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * DELETE /api/posts/bulk-delete
 * 지역별 기사 일괄 삭제
 *
 * Request Body:
 * {
 *   sources: ["여수시", "순천시"],  // 한글 지역명 (DB의 source 컬럼 값)
 *   deleteAll?: true,              // true이면 모든 기사 삭제 (sources 무시)
 *   dateRange?: {
 *     startDate: "2025-12-01",
 *     endDate: "2025-12-12"
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   deleted: { "여수시": 15, "순천시": 23 },
 *   totalDeleted: 38
 * }
 */
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { sources, deleteAll, dateRange } = body;

        // deleteAll 모드: 모든 기사 삭제
        if (deleteAll === true) {
            let query = supabaseAdmin.from('posts').delete();

            // 기간 필터 적용 (선택적)
            if (dateRange?.startDate) {
                query = query.gte('published_at', dateRange.startDate);
            }
            if (dateRange?.endDate) {
                query = query.lte('published_at', `${dateRange.endDate}T23:59:59`);
            }

            // 모든 레코드 삭제를 위해 조건 추가 (Supabase는 조건 없는 delete 거부)
            const { data, error } = await query.not('id', 'is', null).select('id');

            if (error) {
                console.error('Delete all error:', error);
                return NextResponse.json({ message: error.message }, { status: 500 });
            }

            const totalDeleted = data?.length || 0;
            console.log(`Delete ALL completed: ${totalDeleted} posts deleted`);

            return NextResponse.json({
                success: true,
                deleted: { '전체': totalDeleted },
                totalDeleted
            });
        }

        // 기존 로직: sources 기반 삭제
        if (!sources || !Array.isArray(sources) || sources.length === 0) {
            return NextResponse.json(
                { message: '삭제할 지역(sources)을 지정해주세요.' },
                { status: 400 }
            );
        }

        const deleted: Record<string, number> = {};
        let totalDeleted = 0;

        // 각 source별로 삭제 수행
        for (const source of sources) {
            let query = supabaseAdmin
                .from('posts')
                .delete()
                .eq('source', source);

            // 기간 필터 적용 (선택적)
            if (dateRange?.startDate) {
                query = query.gte('published_at', dateRange.startDate);
            }
            if (dateRange?.endDate) {
                // endDate는 해당 일자 23:59:59까지 포함
                query = query.lte('published_at', `${dateRange.endDate}T23:59:59`);
            }

            const { data, error, count } = await query.select('id');

            if (error) {
                console.error(`Delete error for ${source}:`, error);
                deleted[source] = 0;
            } else {
                const deletedCount = data?.length || 0;
                deleted[source] = deletedCount;
                totalDeleted += deletedCount;
            }
        }

        // 삭제 로그 기록 (선택적)
        console.log(`Bulk delete completed: ${totalDeleted} posts deleted from ${sources.join(', ')}`);

        return NextResponse.json({
            success: true,
            deleted,
            totalDeleted
        });

    } catch (error: any) {
        console.error('DELETE /api/posts/bulk-delete error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

/**
 * POST /api/posts/bulk-delete/preview
 * 삭제 전 미리보기 (실제 삭제하지 않고 건수만 반환)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sources, dateRange } = body;

        if (!sources || !Array.isArray(sources) || sources.length === 0) {
            return NextResponse.json(
                { message: '지역(sources)을 지정해주세요.' },
                { status: 400 }
            );
        }

        const preview: Record<string, number> = {};
        let totalCount = 0;

        // 각 source별로 건수 조회
        for (const source of sources) {
            let query = supabaseAdmin
                .from('posts')
                .select('id', { count: 'exact', head: true })
                .eq('source', source);

            // 기간 필터 적용 (선택적)
            if (dateRange?.startDate) {
                query = query.gte('published_at', dateRange.startDate);
            }
            if (dateRange?.endDate) {
                query = query.lte('published_at', `${dateRange.endDate}T23:59:59`);
            }

            const { count, error } = await query;

            if (error) {
                console.error(`Preview error for ${source}:`, error);
                preview[source] = 0;
            } else {
                preview[source] = count || 0;
                totalCount += count || 0;
            }
        }

        return NextResponse.json({
            preview,
            totalCount
        });

    } catch (error: any) {
        console.error('POST /api/posts/bulk-delete (preview) error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
