import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/reporter/stats
 * Get reporter statistics for dashboard
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: 'Login required' },
                { status: 401 }
            );
        }

        // Get reporter info
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('id, region, position, access_level')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: 'Reporter not found' },
                { status: 404 }
            );
        }

        // Get current date info
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

        // My articles count
        const { count: myArticles } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', reporter.id)
            .neq('status', 'trash');

        // Published articles count
        const { count: publishedArticles } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', reporter.id)
            .eq('status', 'published');

        // Pending articles count
        const { count: pendingArticles } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', reporter.id)
            .eq('status', 'pending');

        // My region articles count
        const { count: myRegionArticles } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('source', reporter.region)
            .neq('status', 'trash');

        // This month articles
        const { count: articlesThisMonth } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', reporter.id)
            .gte('published_at', startOfMonth)
            .neq('status', 'trash');

        // Draft articles
        const { count: draftArticles } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', reporter.id)
            .eq('status', 'draft');

        // Rejected articles
        const { count: rejectedArticles } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', reporter.id)
            .eq('status', 'rejected');

        return NextResponse.json({
            stats: {
                myArticles: myArticles || 0,
                publishedArticles: publishedArticles || 0,
                pendingArticles: pendingArticles || 0,
                myRegionArticles: myRegionArticles || 0,
                articlesThisMonth: articlesThisMonth || 0,
                draftArticles: draftArticles || 0,
                rejectedArticles: rejectedArticles || 0,
            },
            reporter: {
                id: reporter.id,
                region: reporter.region,
                position: reporter.position,
            }
        });

    } catch (error: unknown) {
        console.error('GET /api/reporter/stats error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
