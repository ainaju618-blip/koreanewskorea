import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/bot/logs - Fetch bot logs with pagination
export async function GET(req: NextRequest) {
    console.log('[API] Bot logs GET request received');
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    // Limit validation: max 100 to prevent DoS
    const rawLimit = parseInt(searchParams.get('limit') || '50') || 50;
    const limit = Math.min(Math.max(1, rawLimit), 100);
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
            // Sanitize search input to prevent SQL injection
            // Remove special characters that could be used for injection
            const sanitizedSearch = search.replace(/[%_'";\\\x00-\x1f]/g, '').slice(0, 100);
            if (sanitizedSearch.length > 0) {
                query = query.or(`region.ilike.%${sanitizedSearch}%,log_message.ilike.%${sanitizedSearch}%`);
            }
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
        const { log_id, region, status, message, type } = body;

        if (!region || !status) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // Phase 3: log_id가 있으면 직접 해당 로그 업데이트 (경쟁 조건 방지)
        if (log_id) {
            const timeStr = new Date().toLocaleTimeString('ko-KR');
            const isFinished = status === '성공' || status === '실패';

            const { data: existingLog } = await supabaseAdmin
                .from('bot_logs')
                .select('log_message')
                .eq('id', log_id)
                .single();

            const newLogLine = `[${timeStr}] ${message}`;
            const updatedMessage = existingLog?.log_message
                ? existingLog.log_message + '\n' + newLogLine
                : newLogLine;

            const updates: any = {
                status: status === '실패' ? 'failed' : (status === '성공' ? 'success' : 'running'),
                log_message: updatedMessage,
            };

            if (isFinished) {
                updates.ended_at = new Date().toISOString();
            }

            await supabaseAdmin
                .from('bot_logs')
                .update(updates)
                .eq('id', log_id);

            return NextResponse.json({ success: true, matched_by: 'log_id' });
        }

        // 기존 방식: region으로 최신 running 로그 찾기 (fallback)
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
                articles_count: activeLog.articles_count || 0
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
                    articles_count: 0
                });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Log API Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
