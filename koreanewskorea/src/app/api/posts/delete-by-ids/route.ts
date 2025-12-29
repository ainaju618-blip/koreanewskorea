/**
 * POST /api/posts/delete-by-ids
 * ID 배열 기반 대량 삭제 (청크 단위 처리)
 * 
 * Request Body:
 * { ids: string[], force?: boolean }
 * 
 * Response:
 * { success: number, total: number, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Vercel 서버리스 함수 설정
export const maxDuration = 30; // 30초로 증가 (기본 10초)
export const runtime = 'nodejs'; // Edge Runtime 대신 Node.js 사용

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids, force } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs array required' }, { status: 400 });
        }

        console.log(`[POST /api/posts/delete-by-ids] ${ids.length} items, force=${force}`);

        // 청크 단위 처리 (50개씩)
        const CHUNK_SIZE = 50;
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            chunks.push(ids.slice(i, i + CHUNK_SIZE));
        }

        console.log(`[delete-by-ids] Processing ${chunks.length} chunks of ${CHUNK_SIZE} items`);

        let totalSuccess = 0;
        let totalErrors = 0;

        for (const chunk of chunks) {
            const result = force
                ? await supabaseAdmin.from('posts').delete().in('id', chunk)
                : await supabaseAdmin.from('posts').update({ status: 'trash' }).in('id', chunk);

            if (result.error) {
                console.error('[delete-by-ids] Chunk error:', result.error);
                totalErrors += chunk.length;
                continue;
            }
            totalSuccess += chunk.length;
        }

        console.log(`[delete-by-ids] Completed: ${totalSuccess} success, ${totalErrors} errors`);

        return NextResponse.json({
            message: `${totalSuccess} items ${force ? 'permanently deleted' : 'moved to trash'}`,
            success: totalSuccess,
            failed: totalErrors,
            total: ids.length
        });
    } catch (error: any) {
        console.error('POST /api/posts/delete-by-ids error:', error);
        return NextResponse.json({ message: error.message || 'Delete failed' }, { status: 500 });
    }
}

