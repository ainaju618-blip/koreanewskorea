import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Lightweight duplicate check API
 * Called BEFORE visiting detail page to avoid unnecessary page loads
 *
 * POST /api/bot/check-duplicate
 * Body: { urls: string[] } - Array of original_link URLs to check
 * Response: { exists: string[] } - Array of URLs that already exist in DB
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { urls } = body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json(
                { error: 'urls array is required' },
                { status: 400 }
            );
        }

        // Limit batch size to prevent abuse
        const urlsToCheck = urls.slice(0, 100);

        // Query DB for existing URLs
        const { data: existingPosts, error } = await supabaseAdmin
            .from('posts')
            .select('original_link')
            .in('original_link', urlsToCheck)
            .not('status', 'in', '("trash","rejected")');

        if (error) {
            console.error('[check-duplicate] DB Error:', error);
            return NextResponse.json(
                { error: 'Database query failed' },
                { status: 500 }
            );
        }

        // Extract existing URLs
        const existingUrls = existingPosts?.map(p => p.original_link) || [];

        return NextResponse.json({
            exists: existingUrls,
            checked: urlsToCheck.length,
            found: existingUrls.length
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[check-duplicate] Error:', errorMessage);
        return NextResponse.json(
            { error: 'Failed to check duplicates' },
            { status: 500 }
        );
    }
}
