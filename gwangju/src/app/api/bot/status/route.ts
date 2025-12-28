
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/bot/status
// 현재 실행 중인 봇 작업 확인
export async function GET(req: NextRequest) {
    try {
        // 'running' 상태인 가장 최근 로그 조회
        const { data, error } = await supabaseAdmin
            .from('bot_logs')
            .select('*')
            .eq('status', 'running')
            .order('started_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        const isRunning = data && data.length > 0;
        const currentJob = isRunning ? data[0] : null;

        return NextResponse.json({
            isRunning,
            currentJob: currentJob ? {
                id: currentJob.id,
                region: currentJob.region,
                startedAt: currentJob.started_at,
                message: currentJob.log_message
            } : null
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
