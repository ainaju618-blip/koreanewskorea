import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/bot/bot-logs - Fetch bot logs with pagination
// Alternative endpoint to /api/bot/logs
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
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
