import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { shareToSocialMedia, testTelegramConnection } from '@/lib/social';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/social/share
 *
 * Share an article to social media platforms
 *
 * Body:
 * - articleId: string (required)
 * - platforms?: string[] (optional, default: all configured)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { articleId } = body;

        if (!articleId) {
            return NextResponse.json(
                { success: false, error: 'articleId is required' },
                { status: 400 }
            );
        }

        // Get article from database
        const { data: article, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('id, title, ai_summary, region, source, status')
            .eq('id', articleId)
            .single();

        if (fetchError || !article) {
            return NextResponse.json(
                { success: false, error: 'Article not found' },
                { status: 404 }
            );
        }

        // Only share published articles
        if (article.status !== 'published') {
            return NextResponse.json(
                { success: false, error: 'Article is not published' },
                { status: 400 }
            );
        }

        const region = article.source || article.region || '';

        // Share to social media
        const result = await shareToSocialMedia(
            article.id,
            article.title,
            article.ai_summary || undefined,
            region
        );

        // Log result
        console.log(`[Social Share] Article ${articleId}:`, result);

        return NextResponse.json({
            success: true,
            articleId,
            title: article.title,
            results: result
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Social Share] Error:', errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * GET /api/social/share
 *
 * Test social media connections
 */
export async function GET() {
    try {
        const telegram = await testTelegramConnection();

        return NextResponse.json({
            success: true,
            platforms: {
                telegram: {
                    configured: !!process.env.TELEGRAM_BOT_TOKEN,
                    channelConfigured: !!process.env.TELEGRAM_CHANNEL_ID,
                    ...telegram
                }
                // Future: facebook, kakao status
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
