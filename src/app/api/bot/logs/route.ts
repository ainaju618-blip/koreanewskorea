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
        const { log_id, region, status, message, type, created_count, skipped_count } = body;

        if (!region || !status) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // Phase 3: log_id is available, update that specific log (prevents race conditions)
        if (log_id) {
            const timeStr = new Date().toLocaleTimeString('ko-KR');
            const isFinished = status === 'success' || status === 'failed';

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
                status: status === 'failed' ? 'failed' : (status === 'success' ? 'success' : 'running'),
                log_message: updatedMessage,
            };

            if (isFinished) {
                updates.ended_at = new Date().toISOString();

                // Update articles_count on completion (for GitHub Actions)
                if (typeof created_count === 'number') {
                    updates.articles_count = created_count;
                }

                // Store skipped_count in metadata
                if (typeof skipped_count === 'number' && skipped_count > 0) {
                    updates.metadata = {
                        skipped_count: skipped_count,
                        updated_at: new Date().toISOString()
                    };
                }
            }

            await supabaseAdmin
                .from('bot_logs')
                .update(updates)
                .eq('id', log_id);

            return NextResponse.json({ success: true, matched_by: 'log_id' });
        }

        // Fallback: Find latest running log by region (when log_id is not available)
        const { data: activeLogs } = await supabaseAdmin
            .from('bot_logs')
            .select('*')
            .eq('region', region)
            .eq('status', 'running')
            .order('started_at', { ascending: false })
            .limit(1);

        const activeLog = activeLogs && activeLogs.length > 0 ? activeLogs[0] : null;

        if (activeLog) {
            // Update existing running log
            const timeStr = new Date().toLocaleTimeString('ko-KR');
            const newLogLine = `[${timeStr}] ${message}`;
            let updatedMessage = activeLog.log_message ? activeLog.log_message + '\n' + newLogLine : newLogLine;

            // Check if finished (support both Korean and English status)
            const isFinished = status === 'success' || status === 'failed';
            const updates: any = {
                status: status === 'failed' ? 'failed' : (status === 'success' ? 'success' : 'running'),
                log_message: updatedMessage,
            };

            if (isFinished) {
                updates.ended_at = new Date().toISOString();

                // Update articles_count on completion
                if (typeof created_count === 'number') {
                    updates.articles_count = created_count;
                } else {
                    updates.articles_count = activeLog.articles_count || 0;
                }

                // Store skipped_count in metadata
                if (typeof skipped_count === 'number' && skipped_count > 0) {
                    updates.metadata = {
                        ...(activeLog.metadata || {}),
                        skipped_count: skipped_count,
                        updated_at: new Date().toISOString()
                    };
                }
            }

            const { error } = await supabaseAdmin
                .from('bot_logs')
                .update(updates)
                .eq('id', activeLog.id);

            if (error) throw error;
        } else {
            // Create new log entry
            const { error } = await supabaseAdmin
                .from('bot_logs')
                .insert({
                    region: region,
                    status: status === 'failed' ? 'failed' : (status === 'success' ? 'success' : 'running'),
                    started_at: new Date().toISOString(),
                    log_message: `[${new Date().toLocaleTimeString('ko-KR')}] ${message}`,
                    articles_count: typeof created_count === 'number' ? created_count : 0
                });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Log API Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
