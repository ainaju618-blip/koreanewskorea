import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/bot/reset
 * running 상태인 모든 bot_logs를 failed로 강제 변경
 * (서버 크래시 등으로 좀비 상태가 된 로그 정리용)
 */
export async function POST() {
    try {
        // 1. running 상태인 로그 조회
        const { data: runningLogs, error: fetchError } = await supabaseAdmin
            .from('bot_logs')
            .select('id, region')
            .eq('status', 'running');

        if (fetchError) throw fetchError;

        if (!runningLogs || runningLogs.length === 0) {
            return NextResponse.json({
                success: true,
                message: '초기화할 실행 중 로그가 없습니다.',
                count: 0
            });
        }

        // 2. 모두 failed로 변경
        let successCount = 0;
        for (const log of runningLogs) {
            const { error: updateError } = await supabaseAdmin
                .from('bot_logs')
                .update({
                    status: 'failed',
                    log_message: '[강제 리셋됨 by Admin]'
                })
                .eq('id', log.id);

            if (!updateError) {
                successCount++;
                console.log(`[Reset] ${log.region} (ID: ${log.id}) -> failed`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `${successCount}개의 로그가 초기화되었습니다.`,
            count: successCount,
            total: runningLogs.length
        });

    } catch (error: any) {
        console.error('[Reset API Error]', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
