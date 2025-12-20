/**
 * Status Counts API
 * 각 상태별 게시글 개수를 조회
 * 
 * GET /api/posts/stats/by-status
 * Response: { all: 150, draft: 45, published: 80, rejected: 10, trash: 15 }
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        // 모든 상태 개수 조회 (단일 쿼리로 최적화)
        const { data, error } = await supabaseAdmin
            .from('posts')
            .select('status');

        if (error) {
            console.error('Status counts error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 상태별 개수 집계
        const counts: Record<string, number> = {
            all: 0,
            draft: 0,
            published: 0,
            rejected: 0,
            trash: 0,
        };

        if (data) {
            counts.all = data.length;
            data.forEach((post: { status: string }) => {
                const status = post.status || 'draft';
                if (status in counts) {
                    counts[status]++;
                }
            });
        }

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Status counts error:', error);
        return NextResponse.json({ error: 'Failed to get status counts' }, { status: 500 });
    }
}
