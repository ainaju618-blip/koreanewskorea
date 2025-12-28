import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * 수집 통계 API
 * 기간별/지역별 수집량 통계 제공
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, region

    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. 기간 내 수집 로그 가져오기
        const { data: logs, error: logsError } = await supabaseAdmin
            .from('bot_logs')
            .select('region, status, started_at, articles_count')
            .gte('started_at', startDate.toISOString())
            .order('started_at', { ascending: true });

        if (logsError) throw logsError;

        // 2. 일별 통계
        const dailyStats: Record<string, { total: number; success: number; articles: number }> = {};

        // 3. 지역별 통계
        const regionStats: Record<string, { total: number; success: number; articles: number }> = {};

        logs?.forEach(log => {
            const dateKey = log.started_at?.split('T')[0] || 'unknown';
            const region = log.region;

            // 일별
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { total: 0, success: 0, articles: 0 };
            }
            dailyStats[dateKey].total++;
            if (log.status === 'success') dailyStats[dateKey].success++;
            dailyStats[dateKey].articles += log.articles_count || 0;

            // 지역별
            if (!regionStats[region]) {
                regionStats[region] = { total: 0, success: 0, articles: 0 };
            }
            regionStats[region].total++;
            if (log.status === 'success') regionStats[region].success++;
            regionStats[region].articles += log.articles_count || 0;
        });

        // 4. 총계
        const totalRuns = logs?.length || 0;
        const totalSuccess = logs?.filter(l => l.status === 'success').length || 0;
        const totalArticles = logs?.reduce((sum, l) => sum + (l.articles_count || 0), 0) || 0;

        return NextResponse.json({
            period: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                days
            },
            summary: {
                totalRuns,
                totalSuccess,
                successRate: totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0,
                totalArticles,
                avgArticlesPerRun: totalRuns > 0 ? Math.round(totalArticles / totalRuns) : 0
            },
            dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
                date,
                ...stats,
                successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
            })),
            regionStats: Object.entries(regionStats)
                .map(([region, stats]) => ({
                    region,
                    ...stats,
                    successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
                }))
                .sort((a, b) => b.articles - a.articles),
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Stats API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
