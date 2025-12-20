/**
 * POST /api/posts/delete-by-ids
 * ID 배열 기반 대량 삭제 (Vercel DELETE body 문제 우회)
 * 
 * Request Body:
 * { ids: string[], force?: boolean }
 * 
 * Response:
 * { success: number, failed: number, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids, force } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs array required' }, { status: 400 });
        }

        console.log(`[POST /api/posts/delete-by-ids] ${ids.length} items, force=${force}`);

        let result;
        if (force) {
            // Hard delete (permanent)
            result = await supabaseAdmin
                .from('posts')
                .delete()
                .in('id', ids);
        } else {
            // Soft delete (move to trash)
            result = await supabaseAdmin
                .from('posts')
                .update({ status: 'trash' })
                .in('id', ids);
        }

        if (result.error) {
            console.error('[POST /api/posts/delete-by-ids] Supabase error:', result.error);
            return NextResponse.json({ message: result.error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: `${ids.length} items ${force ? 'permanently deleted' : 'moved to trash'}`,
            success: ids.length,
            failed: 0,
        });
    } catch (error: any) {
        console.error('POST /api/posts/delete-by-ids error:', error);
        return NextResponse.json({ message: error.message || 'Delete failed' }, { status: 500 });
    }
}
