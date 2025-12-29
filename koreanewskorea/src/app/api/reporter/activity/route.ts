import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/reporter/activity
 * Fetch recent activity logs for the reporter
 * Uses article_history table to show real activity
 */
export async function GET(req: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: 'Login required.' },
                { status: 401 }
            );
        }

        // Get reporter info
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('id, position, region')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: 'Reporter not found.' },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Fetch activity from article_history
        // For now, show activities where the reporter is either the editor or the author
        const { data: activities, error: activityError } = await supabaseAdmin
            .from('article_history')
            .select(`
                id,
                article_id,
                editor_id,
                action,
                changes,
                created_at,
                posts!inner(id, title, author_id)
            `)
            .or(`editor_id.eq.${reporter.id},posts.author_id.eq.${reporter.id}`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (activityError) {
            console.error('Activity fetch error:', activityError);
            // Return empty array if table doesn't exist or other errors
            return NextResponse.json({ activities: [] });
        }

        // Transform to activity log format
        const transformedActivities = (activities || []).map((activity: {
            id: string;
            article_id: string;
            editor_id: string;
            action: string;
            changes: Record<string, unknown> | null;
            created_at: string;
            posts: { id: string; title: string; author_id: string }[] | { id: string; title: string; author_id: string } | null;
        }) => {
            const post = Array.isArray(activity.posts) ? activity.posts[0] : activity.posts;
            return {
                id: activity.id,
                user_id: activity.editor_id,
                action: mapActionToActivityType(activity.action),
                entity_type: 'article' as const,
                entity_id: activity.article_id,
                entity_name: post?.title || 'Unknown Article',
                created_at: activity.created_at,
            };
        });

        return NextResponse.json({ activities: transformedActivities });

    } catch (error: unknown) {
        console.error('GET /api/reporter/activity error:', error);
        const message = error instanceof Error ? error.message : 'Server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * Map article_history action to activity feed action type
 */
function mapActionToActivityType(action: string): string {
    const actionMap: Record<string, string> = {
        'created': 'article_created',
        'updated': 'article_saved',
        'submitted': 'article_submitted',
        'approved': 'article_approved',
        'rejected': 'article_rejected',
        'published': 'article_published',
    };
    return actionMap[action] || 'article_saved';
}
