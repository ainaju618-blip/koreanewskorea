/**
 * Status Counts API
 * Uses count: 'exact' to get accurate counts beyond 1000 limit
 *
 * GET /api/posts/stats/by-status
 * Response: { all: 1500, draft: 45, published: 1200, rejected: 10, trash: 15 }
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        // Use count: 'exact' for accurate counts beyond 1000 limit
        const [allCount, draftCount, publishedCount, rejectedCount, trashCount] = await Promise.all([
            supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
            supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
            supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
            supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'trash'),
        ]);

        const counts = {
            all: allCount.count || 0,
            draft: draftCount.count || 0,
            published: publishedCount.count || 0,
            rejected: rejectedCount.count || 0,
            trash: trashCount.count || 0,
        };

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Status counts error:', error);
        return NextResponse.json({ error: 'Failed to get status counts' }, { status: 500 });
    }
}
