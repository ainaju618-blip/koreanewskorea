import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAccessibleRegions, getAccessibleRegionsMulti } from '@/lib/regions';

/**
 * GET /api/reporter/stats
 * Get reporter statistics for dashboard
 * Supports multi-region via reporter_regions junction table
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

        // Get regions from junction table (multi-region support)
        const { data: reporterRegions } = await supabaseAdmin
            .from('reporter_regions')
            .select('region')
            .eq('reporter_id', reporter.id);

        // Extract region strings from junction table, fallback to single region
        const assignedRegions: string[] = reporterRegions && reporterRegions.length > 0
            ? reporterRegions.map(r => r.region)
            : (reporter.region ? [reporter.region] : []);

        // Get accessible regions (supports multi-region)
        const accessibleRegions = assignedRegions.length > 1
            ? getAccessibleRegionsMulti(reporter.position, assignedRegions)
            : getAccessibleRegions(reporter.position, reporter.region);

        // Get current date info
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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

        // My region articles count (supports multi-region)
        let myRegionArticles = 0;
        if (accessibleRegions === null) {
            // Editor-in-chief: count all
            const { count } = await supabaseAdmin
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'trash');
            myRegionArticles = count || 0;
        } else if (accessibleRegions.length === 1) {
            // Single region
            const { count } = await supabaseAdmin
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('source', accessibleRegions[0])
                .neq('status', 'trash');
            myRegionArticles = count || 0;
        } else if (accessibleRegions.length > 1) {
            // Multiple regions
            const { count } = await supabaseAdmin
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .in('source', accessibleRegions)
                .neq('status', 'trash');
            myRegionArticles = count || 0;
        }

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
                myRegionArticles: myRegionArticles,
                articlesThisMonth: articlesThisMonth || 0,
                draftArticles: draftArticles || 0,
                rejectedArticles: rejectedArticles || 0,
            },
            reporter: {
                id: reporter.id,
                region: reporter.region,
                regions: assignedRegions,
                position: reporter.position,
            }
        });

    } catch (error: unknown) {
        console.error('GET /api/reporter/stats error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
