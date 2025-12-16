import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { BlogPostInput } from '@/types/blog';

// GET: List posts with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query params
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'created_at:desc';

        // Build query
        let query = supabaseAdmin
            .from('blog_posts')
            .select('*', { count: 'exact' });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (category) {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // Apply sorting
        const [sortField, sortDir] = sort.split(':');
        query = query.order(sortField, { ascending: sortDir === 'asc' });

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Blog posts fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch posts' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            posts: data || [],
            totalCount: count || 0,
            page,
            pageSize: limit,
            totalPages: Math.ceil((count || 0) / limit)
        });

    } catch (error) {
        console.error('Blog posts error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new post
export async function POST(request: NextRequest) {
    try {
        const body: BlogPostInput = await request.json();

        // Validate required fields
        if (!body.title || !body.content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        // Generate slug
        const { data: slugData } = await supabaseAdmin
            .rpc('generate_blog_slug', { title: body.title });

        const slug = slugData || body.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100);

        // Create post
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                title: body.title,
                slug: slug,
                content: body.content,
                excerpt: body.excerpt || body.content.substring(0, 200),
                category: body.category || 'sf-entertainment',
                tags: body.tags || [],
                thumbnail_url: body.thumbnail_url,
                seo_title: body.seo_title || body.title,
                seo_description: body.seo_description || body.content.substring(0, 160),
                status: body.status || 'draft',
                published_at: body.status === 'published' ? new Date().toISOString() : null,
                ai_generated: body.ai_generated || false,
                source_url: body.source_url,
                author_name: 'CosmicPulse AI'
            })
            .select()
            .single();

        if (error) {
            console.error('Blog post create error:', error);
            return NextResponse.json(
                { error: 'Failed to create post' },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });

    } catch (error) {
        console.error('Blog post create error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
