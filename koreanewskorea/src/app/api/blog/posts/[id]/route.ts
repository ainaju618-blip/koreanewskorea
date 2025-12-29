import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { BlogPostInput } from '@/types/blog';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Single post by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Blog post fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update post
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body: Partial<BlogPostInput> = await request.json();

        // Build update object
        const updateData: Record<string, unknown> = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url;
        if (body.seo_title !== undefined) updateData.seo_title = body.seo_title;
        if (body.seo_description !== undefined) updateData.seo_description = body.seo_description;
        if (body.source_url !== undefined) updateData.source_url = body.source_url;

        // Handle status change
        if (body.status !== undefined) {
            updateData.status = body.status;
            if (body.status === 'published') {
                updateData.published_at = new Date().toISOString();
            }
        }

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Blog post update error:', error);
            return NextResponse.json(
                { error: 'Failed to update post' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Blog post update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete post (soft delete - move to trash)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get('permanent') === 'true';

        if (permanent) {
            // Hard delete
            const { error } = await supabaseAdmin
                .from('blog_posts')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Blog post delete error:', error);
                return NextResponse.json(
                    { error: 'Failed to delete post' },
                    { status: 500 }
                );
            }
        } else {
            // Soft delete - move to trash
            const { error } = await supabaseAdmin
                .from('blog_posts')
                .update({ status: 'trash' })
                .eq('id', id);

            if (error) {
                console.error('Blog post trash error:', error);
                return NextResponse.json(
                    { error: 'Failed to trash post' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Blog post delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
