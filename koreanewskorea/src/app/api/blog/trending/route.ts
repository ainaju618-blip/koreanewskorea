import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        // Fetch unexpired, unused trending topics
        const { data, error } = await supabaseAdmin
            .from('blog_trending_topics')
            .select('*')
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Trending fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch trending topics' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            topics: data || []
        });

    } catch (error) {
        console.error('Trending error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Add new trending topic (from crawler)
export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.topic || !body.source) {
            return NextResponse.json(
                { error: 'Topic and source are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('blog_trending_topics')
            .insert({
                topic: body.topic,
                keywords: body.keywords || [],
                source: body.source,
                score: body.score || 0,
                mentions: body.mentions || 1
            })
            .select()
            .single();

        if (error) {
            console.error('Trending insert error:', error);
            return NextResponse.json(
                { error: 'Failed to add trending topic' },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });

    } catch (error) {
        console.error('Trending error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
