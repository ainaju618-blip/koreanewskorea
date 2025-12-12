
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    try {
        let query = supabaseAdmin
            .from('bot_logs')
            .select('*', { count: 'exact' })
            .order('started_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            // region 또는 log_message 검색
            query = query.or(`region.ilike.%${search}%,log_message.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            logs: data,
            total: count,
            page: page,
            limit: limit
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { region, status, message, type } = body;

        if (!region || !status) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // 1. 해당 지역의 'running' 상태인 최신 로그 찾기
        const { data: activeLogs } = await supabaseAdmin
            .from('bot_logs')
            .select('*')
            .eq('region', region)
            .eq('status', 'running')
            .order('started_at', { ascending: false })
            .limit(1);

        const activeLog = activeLogs && activeLogs.length > 0 ? activeLogs[0] : null;

        if (activeLog) {
            // 2. 이미 실행 중인 로그가 있으면 업데이트 (메시지 누적)
            // 타임스탬프 추가
            const timeStr = new Date().toLocaleTimeString('ko-KR');
            const newLogLine = `[${timeStr}] ${message}`;

            // 기존 메시지가 너무 길면 앞부분 자르기 (선택사항, DB 용량 고려)
            let updatedMessage = activeLog.log_message ? activeLog.log_message + '\n' + newLogLine : newLogLine;

            // 상태가 '성공'이나 '실패'로 바뀌면 finished_at 업데이트
            const isFinished = status === '성공' || status === '실패';
            const updates: any = {
                status: status === '실패' ? 'failure' : (status === '성공' ? 'success' : 'running'),
                log_message: updatedMessage,
                collected_count: activeLog.collected_count // 스크래퍼가 보내준 count로 업데이트하면 좋겠지만 지금은 유지
            };

            if (isFinished) {
                updates.finished_at = new Date().toISOString();
            }

            const { error } = await supabaseAdmin
                .from('bot_logs')
                .update(updates)
                .eq('id', activeLog.id);

            if (error) throw error;
        } else {
            // 3. 없으면 새로 시작 (하지만 스크래퍼는 중간부터 로그를 보낼 수도 있음)
            // 보통 '스크래퍼 시작' 메시지와 함께 옴.
            const { error } = await supabaseAdmin
                .from('bot_logs')
                .insert({
                    region: region,
                    status: status === '실패' ? 'failure' : (status === '성공' ? 'success' : 'running'),
                    started_at: new Date().toISOString(),
                    log_message: `[${new Date().toLocaleTimeString('ko-KR')}] ${message}`,
                    collected_count: 0
                });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Log API Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
