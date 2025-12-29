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
        // Count unprocessed articles
        const { count: unprocessedCount, error: err1 } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft')
            .or('ai_processed.is.null,ai_processed.eq.false');

        if (err1) throw err1;

        // Count C/D grade articles for retry
        const { count: retryCount, error: err2 } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft')
            .eq('ai_processed', true)
            .in('ai_validation_grade', ['C', 'D']);

        if (err2) throw err2;

        const totalCount = (unprocessedCount || 0) + (retryCount || 0);

        return NextResponse.json({
            count: totalCount,
            unprocessed: unprocessedCount || 0,
            retry: retryCount || 0
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[pending-count API] Error:', errorMessage);
        return NextResponse.json({ count: 0, error: errorMessage }, { status: 500 });
    }
}
