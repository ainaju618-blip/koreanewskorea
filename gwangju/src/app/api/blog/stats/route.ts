import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        // Fetch all stats in parallel
        const [
            totalPostsRes,
            publishedPostsRes,
            draftPostsRes,
            aiGeneratedRes,
            viewsRes,
            sourcesRes,
            trendingRes
        ] = await Promise.all([
            // Total posts
            supabaseAdmin
                .from('blog_posts')
                .select('id', { count: 'exact', head: true }),

            // Published posts
            supabaseAdmin
                .from('blog_posts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'published'),

            // Draft posts
            supabaseAdmin
                .from('blog_posts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'draft'),

            // AI generated posts
            supabaseAdmin
                .from('blog_posts')
                .select('id', { count: 'exact', head: true })
                .eq('ai_generated', true),

            // Total views
            supabaseAdmin
                .from('blog_posts')
                .select('view_count'),

            // Active sources
            supabaseAdmin
                .from('blog_sources')
                .select('id', { count: 'exact', head: true })
                .eq('enabled', true),

            // Pending trending topics
            supabaseAdmin
                .from('blog_trending_topics')
                .select('id', { count: 'exact', head: true })
                .eq('used', false)
                .gt('expires_at', new Date().toISOString())
        ]);

        // Calculate total views
        const totalViews = viewsRes.data?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

        return NextResponse.json({
            total_posts: totalPostsRes.count || 0,
            published_posts: publishedPostsRes.count || 0,
            draft_posts: draftPostsRes.count || 0,
            ai_generated_posts: aiGeneratedRes.count || 0,
            total_views: totalViews,
            active_sources: sourcesRes.count || 0,
            pending_topics: trendingRes.count || 0
        });

    } catch (error) {
        console.error('Blog stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
