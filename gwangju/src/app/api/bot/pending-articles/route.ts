import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Get list of pending articles for AI processing
// Includes: 1) Unprocessed articles, 2) C/D grade articles for re-processing
export async function GET() {
    try {
        // Get unprocessed articles
        const { data: unprocessed, error: err1 } = await supabaseAdmin
            .from('posts')
            .select('id, title, region, created_at, ai_validation_grade')
            .eq('status', 'draft')
            .or('ai_processed.is.null,ai_processed.eq.false')
            .order('created_at', { ascending: true })
            .limit(100);

        if (err1) throw err1;

        // Get C/D grade articles for retry (already processed but failed)
        const { data: failedArticles, error: err2 } = await supabaseAdmin
            .from('posts')
            .select('id, title, region, created_at, ai_validation_grade')
            .eq('status', 'draft')
            .eq('ai_processed', true)
            .in('ai_validation_grade', ['C', 'D'])
            .order('created_at', { ascending: true })
            .limit(100);

        if (err2) throw err2;

        // Combine and dedupe
        const allArticles = [...(unprocessed || []), ...(failedArticles || [])];
        const uniqueArticles = allArticles.filter((article, index, self) =>
            index === self.findIndex(a => a.id === article.id)
        );

        return NextResponse.json({
            success: true,
            count: uniqueArticles.length,
            unprocessedCount: unprocessed?.length || 0,
            retryCount: failedArticles?.length || 0,
            articles: uniqueArticles
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[pending-articles] Error:', errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage, articles: [] },
            { status: 500 }
        );
    }
}
