import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * 스크래퍼 Health Check API
 * 각 스크래퍼의 마지막 성공/실패 시간, 수집 통계를 반환
 */
export async function GET(req: NextRequest) {
    try {
        // 1. 각 지역별 최근 로그 가져오기 (성공/실패 상태)
        const { data: recentLogs, error: logsError } = await supabaseAdmin
            .from('bot_logs')
            .select('region, status, started_at, ended_at, articles_count, log_message')
            .order('started_at', { ascending: false })
            .limit(200);

        if (logsError) throw logsError;

        // 2. 지역별 마지막 성공/실패 기록 정리
        const healthMap: Record<string, {
            lastSuccess: string | null;
            lastFailure: string | null;
            lastRun: string | null;
            lastStatus: string;
            totalArticles: number;
            successRate: number;
            recentRuns: number;
        }> = {};

        const regionStats: Record<string, { success: number; failed: number; total: number; articles: number }> = {};

        recentLogs?.forEach(log => {
            const region = log.region;

            if (!regionStats[region]) {
                regionStats[region] = { success: 0, failed: 0, total: 0, articles: 0 };
            }

            regionStats[region].total++;
            regionStats[region].articles += log.articles_count || 0;

            if (log.status === 'success') {
                regionStats[region].success++;
            } else if (['failed', 'error'].includes(log.status)) {
                regionStats[region].failed++;
            }

            if (!healthMap[region]) {
                healthMap[region] = {
                    lastSuccess: null,
                    lastFailure: null,
                    lastRun: log.started_at,
                    lastStatus: log.status,
                    totalArticles: 0,
                    successRate: 0,
                    recentRuns: 0
                };
            }

            if (log.status === 'success' && !healthMap[region].lastSuccess) {
                healthMap[region].lastSuccess = log.started_at;
            }
            if (['failed', 'error'].includes(log.status) && !healthMap[region].lastFailure) {
                healthMap[region].lastFailure = log.started_at;
            }
        });

        // 성공률 계산
        Object.keys(regionStats).forEach(region => {
            const stats = regionStats[region];
            healthMap[region].successRate = stats.total > 0
                ? Math.round((stats.success / stats.total) * 100)
                : 0;
            healthMap[region].totalArticles = stats.articles;
            healthMap[region].recentRuns = stats.total;
        });

        // 3. 전체 통계
        const totalRegions = Object.keys(healthMap).length;
        const healthyRegions = Object.values(healthMap).filter(h => h.lastStatus === 'success').length;
        const failedRegions = Object.values(healthMap).filter(h => ['failed', 'error'].includes(h.lastStatus)).length;

        return NextResponse.json({
            summary: {
                totalRegions,
                healthyRegions,
                failedRegions,
                runningRegions: totalRegions - healthyRegions - failedRegions
            },
            regions: healthMap,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Health Check API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
