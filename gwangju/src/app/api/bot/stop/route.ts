import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { killProcess, killAllProcesses, getRunningProcesses } from '@/lib/bot-service';

export async function POST(req: NextRequest) {
    try {
        let body: { region?: string; jobId?: number } = {};
        try {
            body = await req.json();
        } catch {
            // body가 없는 경우 (전체 중지)
        }

        const { region, jobId } = body;

        // 개별 지역 중지 요청인 경우
        if (region || jobId) {
            console.log(`[API] Stopping single scraper: region=${region}, jobId=${jobId}`);

            // 1. 프로세스 종료 (실제 kill)
            let processKilled = false;
            if (jobId) {
                processKilled = killProcess(jobId);
                console.log(`[API] Process kill result: ${processKilled}`);
            }

            // 2. DB에서 해당 작업 상태를 'stopped'로 업데이트
            if (jobId) {
                await supabaseAdmin
                    .from('bot_logs')
                    .update({
                        status: 'stopped',
                        ended_at: new Date().toISOString(),
                        log_message: '사용자에 의해 중지됨'
                    })
                    .eq('id', jobId);
            }

            return NextResponse.json({
                success: true,
                message: `${region || 'Job #' + jobId} 스크래퍼가 중지되었습니다.`,
                processKilled,
                stoppedJobId: jobId
            });
        }

        // 전체 중지 요청
        console.log('[API] Stopping all scrapers');

        // 1. 현재 실행 중인 프로세스 목록 확인
        const runningJobIds = getRunningProcesses();
        console.log(`[API] Running processes: ${runningJobIds.length}`);

        // 2. 모든 프로세스 종료
        const killedCount = killAllProcesses();
        console.log(`[API] Killed ${killedCount} processes`);

        // 3. DB에서 모든 running 상태를 stopped로 업데이트
        const { data: runningLogs } = await supabaseAdmin
            .from('bot_logs')
            .select('id')
            .eq('status', 'running');

        if (runningLogs && runningLogs.length > 0) {
            for (const log of runningLogs) {
                await supabaseAdmin
                    .from('bot_logs')
                    .update({
                        status: 'stopped',
                        ended_at: new Date().toISOString(),
                        log_message: '사용자에 의해 중지됨'
                    })
                    .eq('id', log.id);
            }
        }

        return NextResponse.json({
            success: true,
            message: '모든 스크래퍼가 중지되었습니다.',
            killedProcesses: killedCount,
            stoppedDbRecords: runningLogs?.length || 0
        });

    } catch (error: any) {
        console.error('[API] Stop error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
