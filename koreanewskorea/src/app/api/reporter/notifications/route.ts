import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/reporter/notifications
 * Get notifications for current reporter
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
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: 'Reporter not found' },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const unreadOnly = searchParams.get('unread') === 'true';

        let query = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('recipient_id', reporter.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Notifications query error:', error);
            throw error;
        }

        // Get unread count
        const { count: unreadCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', reporter.id)
            .eq('is_read', false);

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
        });

    } catch (error: unknown) {
        console.error('GET /api/reporter/notifications error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * PUT /api/reporter/notifications
 * Mark notifications as read
 */
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: 'Login required' },
                { status: 401 }
            );
        }

        const { data: reporter } = await supabaseAdmin
            .from('reporters')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!reporter) {
            return NextResponse.json(
                { message: 'Reporter not found' },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { notificationIds, markAllRead } = body;

        if (markAllRead) {
            // Mark all as read
            await supabaseAdmin
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('recipient_id', reporter.id)
                .eq('is_read', false);
        } else if (notificationIds && notificationIds.length > 0) {
            // Mark specific notifications as read
            await supabaseAdmin
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('recipient_id', reporter.id)
                .in('id', notificationIds);
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('PUT /api/reporter/notifications error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
