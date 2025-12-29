import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/reporter/articles/[id]/history
 * Get article edit history
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: 'Login required' },
                { status: 401 }
            );
        }

        // Get reporter info
        const { data: reporter } = await supabaseAdmin
            .from('reporters')
            .select('id, access_level')
            .eq('user_id', user.id)
            .single();

        if (!reporter) {
            return NextResponse.json(
                { message: 'Reporter not found' },
                { status: 404 }
            );
        }

        // Get article
        const { data: article } = await supabaseAdmin
            .from('posts')
            .select('id, title, source, author_id')
            .eq('id', id)
            .single();

        if (!article) {
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        // Check access (author, same region, or high access level)
        const hasAccess = reporter.access_level >= 2 ||
            article.author_id === reporter.id;

        if (!hasAccess) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // Get history
        const { data: history, error } = await supabaseAdmin
            .from('article_history')
            .select('*')
            .eq('article_id', id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('History query error:', error);
            throw error;
        }

        return NextResponse.json({
            article: {
                id: article.id,
                title: article.title,
            },
            history: history || [],
        });

    } catch (error: unknown) {
        console.error('GET article history error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
