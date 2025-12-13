import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

            // 1. DB에서 해당 작업 상태를 'stopped'로 업데이트
            if (jobId) {
                await supabaseAdmin
                    .from('bot_logs')
                    .update({
                        status: 'stopped',
                        ended_at: new Date().toISOString()
                    })
                    .eq('id', jobId);

                // 로그 메시지 추가
                const { data: existingLog } = await supabaseAdmin
                    .from('bot_logs')
                    .select('log_message')
                    .eq('id', jobId)
                    .single();

                if (existingLog) {
                    const timeStr = new Date().toLocaleTimeString('ko-KR');
                    const newMessage = existingLog.log_message
                        ? existingLog.log_message + `\n[${timeStr}] ⚠️ 사용자에 의해 중지됨`
                        : `[${timeStr}] ⚠️ 사용자에 의해 중지됨`;

                    await supabaseAdmin
                        .from('bot_logs')
                        .update({ log_message: newMessage })
                        .eq('id', jobId);
                }
            }

            // 2. 특정 지역 스크래퍼 프로세스만 종료 시도
            // Windows에서는 프로세스 이름으로 특정하기 어려우므로,
            // 일단 DB 상태만 업데이트하고 프로세스는 자연 종료 대기
            // (스크래퍼가 DB 상태를 체크하고 스스로 종료하도록 할 수도 있음)

            return NextResponse.json({
                success: true,
                message: `${region || 'Job #' + jobId} 스크래퍼가 중지되었습니다.`,
                stoppedJobId: jobId
            });
        }

        // 전체 중지 요청
        console.log('[API] Stopping all scrapers');

        // 1. DB에서 모든 running 상태를 stopped로 업데이트
        const { data: runningLogs } = await supabaseAdmin
            .from('bot_logs')
            .select('id, log_message')
            .eq('status', 'running');

        if (runningLogs && runningLogs.length > 0) {
            const timeStr = new Date().toLocaleTimeString('ko-KR');

            for (const log of runningLogs) {
                const newMessage = log.log_message
                    ? log.log_message + `\n[${timeStr}] ⚠️ 사용자에 의해 중지됨`
                    : `[${timeStr}] ⚠️ 사용자에 의해 중지됨`;

                await supabaseAdmin
                    .from('bot_logs')
                    .update({
                        status: 'stopped',
                        ended_at: new Date().toISOString(),
                        log_message: newMessage
                    })
                    .eq('id', log.id);
            }
        }

        // 2. Windows에서 Python 프로세스 종료
        const killCommand = process.platform === 'win32'
            ? 'taskkill /f /im python.exe 2>nul || echo No python processes'
            : 'pkill -f python || echo No python processes';

        return new Promise<Response>((resolve) => {
            exec(killCommand, (error, stdout, stderr) => {
                if (error && !stderr.includes('not found')) {
                    console.error('Kill command error:', error);
                }

                console.log('[API] Bot stop executed:', stdout);

                resolve(NextResponse.json({
                    success: true,
                    message: '모든 스크래퍼가 중지되었습니다.',
                    stoppedCount: runningLogs?.length || 0,
                    output: stdout
                }));
            });
        });

    } catch (error: any) {
        console.error('[API] Stop error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
