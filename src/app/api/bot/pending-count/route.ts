import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Count pending articles that need AI processing
// Includes: 1) Unprocessed articles, 2) C/D grade articles for re-processing
export async function GET() {
    try {
        // Try complex query first (with ai_processed column)
        const { count: unprocessedCount, error: err1 } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft')
            .or('ai_processed.is.null,ai_processed.eq.false');

        if (err1) {
            // Fallback: If ai_processed column doesn't exist, just count all draft articles
            console.log('[pending-count API] Fallback to simple draft count');
            const { count: draftCount, error: fallbackErr } = await supabaseAdmin
                .from('posts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'draft');

            if (fallbackErr) throw fallbackErr;

            return NextResponse.json({
                count: draftCount || 0,
                unprocessed: draftCount || 0,
                retry: 0,
                fallback: true
            });
        }

        // Count C/D grade articles for retry (only if first query succeeded)
        let retryCount = 0;
        const { count: retry, error: err2 } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft')
            .eq('ai_processed', true)
            .in('ai_validation_grade', ['C', 'D']);

        if (!err2) {
            retryCount = retry || 0;
        }

        const totalCount = (unprocessedCount || 0) + retryCount;

        return NextResponse.json({
            count: totalCount,
            unprocessed: unprocessedCount || 0,
            retry: retryCount
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[pending-count API] Error:', errorMessage);
        return NextResponse.json({ count: 0, error: errorMessage }, { status: 500 });
    }
}
