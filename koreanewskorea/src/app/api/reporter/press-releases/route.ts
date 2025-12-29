import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAccessibleRegions } from '@/lib/regions';

/**
 * GET /api/reporter/press-releases
 * Fetch press releases for the reporter based on their region access
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
        const search = searchParams.get('search') || '';
        const region = searchParams.get('region') || 'all';
        const sortBy = searchParams.get('sort') || 'latest';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Get accessible regions for this reporter
        const accessibleRegions = getAccessibleRegions(reporter.position, reporter.region);

        // Build query
        let query = supabaseAdmin
            .from('press_releases')
            .select(`
                id,
                title,
                source,
                content_preview,
                region,
                received_at,
                status,
                original_link,
                converted_article_id
            `, { count: 'exact' });

        // Filter by accessible regions (unless editor-in-chief who sees all)
        if (accessibleRegions !== null) {
            query = query.in('region', accessibleRegions);
        }

        // Additional region filter if specified
        if (region !== 'all') {
            query = query.eq('region', region);
        }

        // Search filter
        if (search) {
            query = query.ilike('title', `%${search}%`);
        }

        // Sorting
        if (sortBy === 'oldest') {
            query = query.order('received_at', { ascending: true });
        } else if (sortBy === 'unread') {
            // For unread sorting, we need a different approach
            query = query.order('status', { ascending: true })
                .order('received_at', { ascending: false });
        } else {
            // Default: latest
            query = query.order('received_at', { ascending: false });
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data: releases, error, count } = await query;

        if (error) {
            // If table doesn't exist yet, return empty array
            if (error.code === '42P01') {
                return NextResponse.json({
                    releases: [],
                    pagination: { page, limit, total: 0, totalPages: 0 },
                    tableExists: false,
                });
            }
            console.error('Press releases query error:', error);
            throw error;
        }

        // Get read status for this reporter
        const { data: readRecords } = await supabaseAdmin
            .from('press_release_reads')
            .select('press_release_id')
            .eq('reporter_id', reporter.id);

        const readIds = new Set((readRecords || []).map(r => r.press_release_id));

        // Transform to include is_read field
        const transformedReleases = (releases || []).map(release => ({
            ...release,
            is_read: readIds.has(release.id),
        }));

        return NextResponse.json({
            releases: transformedReleases,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });

    } catch (error: unknown) {
        console.error('GET /api/reporter/press-releases error:', error);
        const message = error instanceof Error ? error.message : 'Server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * PATCH /api/reporter/press-releases
 * Mark a press release as read
 */
export async function PATCH(req: NextRequest) {
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
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: 'Reporter not found.' },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { press_release_id } = body;

        if (!press_release_id) {
            return NextResponse.json(
                { message: 'press_release_id is required.' },
                { status: 400 }
            );
        }

        // Insert read record (upsert to avoid duplicates)
        const { error: insertError } = await supabaseAdmin
            .from('press_release_reads')
            .upsert(
                {
                    press_release_id,
                    reporter_id: reporter.id,
                },
                { onConflict: 'press_release_id,reporter_id' }
            );

        if (insertError) {
            console.error('Mark as read error:', insertError);
            throw insertError;
        }

        // Update press release status if it's 'new'
        await supabaseAdmin
            .from('press_releases')
            .update({ status: 'viewed' })
            .eq('id', press_release_id)
            .eq('status', 'new');

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('PATCH /api/reporter/press-releases error:', error);
        const message = error instanceof Error ? error.message : 'Server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
