/**
 * Trigger AI Processing Bot
 *
 * This endpoint is called by the scraper after collecting new articles.
 * It triggers AI processing for pending articles.
 *
 * Features:
 * - Can process specific articles by ID
 * - Can filter by region
 * - Uses lightweight or full mode
 * - API key authentication
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API key for authentication (MUST be set in environment variables)
const BOT_API_KEY = process.env.BOT_API_KEY;
if (!BOT_API_KEY) {
    console.error('[trigger-ai-process] CRITICAL: BOT_API_KEY environment variable is not set');
}

// Local API endpoint for single article processing
const PROCESS_SINGLE_URL = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/bot/process-single-article`
    : 'http://localhost:3000/api/bot/process-single-article';

interface TriggerRequest {
    region?: string;
    article_ids?: number[];
    mode?: 'lightweight' | 'full';
    limit?: number;
}

interface ProcessResult {
    id: number;
    success: boolean;
    grade?: string;
    error?: string;
}

async function processSingleArticle(
    articleId: number,
    mode: string,
    apiKey: string
): Promise<ProcessResult> {
    try {
        const response = await fetch(PROCESS_SINGLE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                articleId,
                mode
            })
        });

        if (!response.ok) {
            return {
                id: articleId,
                success: false,
                error: `HTTP ${response.status}`
            };
        }

        const result = await response.json();
        return {
            id: articleId,
            success: true,
            grade: result.grade || 'B'
        };
    } catch (error) {
        return {
            id: articleId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function POST(request: Request) {
    console.log('[trigger-ai-process] POST request received');

    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== BOT_API_KEY) {
        console.log('[trigger-ai-process] Invalid API key');
        return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
        );
    }

    try {
        const body: TriggerRequest = await request.json();
        const {
            region,
            article_ids,
            mode = 'lightweight',
            limit = 10
        } = body;

        console.log('[trigger-ai-process] Request params:', {
            region,
            article_ids_count: article_ids?.length || 0,
            mode,
            limit
        });

        // Build query for articles needing AI processing
        // OR conditions:
        // 1. status='pending' (new articles from scraper)
        // 2. status='draft' AND ai_processed IS NULL (never processed)
        // NOTE: Removed condition "ai_processed=true" which caused infinite loop bug
        let query = supabaseAdmin
            .from('posts')
            .select('id, title, region, status, ai_processed, ai_validation_grade')
            .or('status.eq.pending,and(status.eq.draft,ai_processed.is.null)')
            .order('created_at', { ascending: true })
            .limit(limit);

        // Filter by region if specified
        if (region) {
            query = query.eq('region', region);
        }

        // Filter by specific article IDs if specified
        if (article_ids && article_ids.length > 0) {
            query = query.in('id', article_ids);
        }

        const { data: articles, error } = await query;

        console.log('[trigger-ai-process] Query results:', {
            found: articles?.length || 0,
            pending: articles?.filter(a => a.status === 'pending').length || 0,
            draft_unprocessed: articles?.filter(a => a.status === 'draft' && !a.ai_processed).length || 0
        });

        if (error) {
            console.error('[trigger-ai-process] DB query error:', error.message);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        if (!articles || articles.length === 0) {
            console.log('[trigger-ai-process] No pending articles found');
            return NextResponse.json({
                success: true,
                message: 'No pending articles to process',
                processed: 0,
                results: []
            });
        }

        console.log(`[trigger-ai-process] Found ${articles.length} pending articles`);

        // Process articles one by one
        const results: ProcessResult[] = [];
        let successCount = 0;
        let failCount = 0;

        for (const article of articles) {
            console.log(`[trigger-ai-process] Processing article ${article.id}: ${article.title?.substring(0, 30)}...`);

            const result = await processSingleArticle(article.id, mode, BOT_API_KEY);
            results.push(result);

            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }

            // Small delay between articles to prevent overload
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[trigger-ai-process] Complete: success=${successCount}, fail=${failCount}`);

        // Log to monitor_activity_log
        try {
            await supabaseAdmin.from('monitor_activity_log').insert({
                event_type: 'ai',
                region: region || 'all',
                message: `AI processing triggered: ${successCount} success, ${failCount} failed`,
                details: {
                    mode,
                    article_count: articles.length,
                    success_count: successCount,
                    fail_count: failCount
                },
                created_at: new Date().toISOString()
            });
        } catch (logError) {
            console.warn('[trigger-ai-process] Failed to log activity:', logError);
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${articles.length} articles`,
            processed: articles.length,
            success_count: successCount,
            fail_count: failCount,
            results
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[trigger-ai-process] Error:', errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// GET: Check trigger endpoint health
export async function GET() {
    return NextResponse.json({
        success: true,
        endpoint: 'trigger-ai-process',
        status: 'ready',
        description: 'Trigger AI processing for pending articles'
    });
}
