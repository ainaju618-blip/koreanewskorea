
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Next.js 16+ 동적 라우트 타입 정의
interface RouteParams {
    params: Promise<{ id: string }>;
}

// UPDATE
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();

        // [Touch-to-Top Logic]
        // 승인(published) 시, 시간을 현재로 갱신하여 메인 상단 노출 보장
        // (기존 created_at 유지 원하면 created_at 줄은 삭제 가능, 하지만 '최신순' 정렬을 위해 보통 같이 갱신함)
        if (body.status === 'published') {
            const now = new Date().toISOString();
            body.published_at = now;
            // body.created_at = now; // 선택사항: 정렬 기준이 created_at이라면 이것도 갱신 필요
        }

        console.log('[PATCH /api/posts] ID:', id, 'Body:', JSON.stringify(body));

        const { data, error } = await supabaseAdmin
            .from('posts')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PATCH /api/posts] Supabase Error:', error);
            throw error;
        }

        console.log('[PATCH /api/posts] Success:', data?.id);
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('[PATCH /api/posts] Catch Error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

// DELETE
// DELETE
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true';

        let result;

        if (force) {
            // 영구 삭제 전 이미지 정보 조회
            const { data: post } = await supabaseAdmin
                .from('posts')
                .select('thumbnail_url')
                .eq('id', id)
                .single();

            // 로컬 이미지 삭제 (thumbnail_url이 /images/로 시작하는 경우)
            if (post?.thumbnail_url?.startsWith('/images/')) {
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    const filePath = path.join(process.cwd(), 'public', post.thumbnail_url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`[이미지 삭제] ${post.thumbnail_url}`);
                    }
                } catch (fsError) {
                    console.warn('[이미지 삭제 실패]', fsError);
                    // 이미지 삭제 실패해도 기사 삭제는 진행
                }
            }

            // 영구 삭제 (Hard Delete)
            result = await supabaseAdmin
                .from('posts')
                .delete()
                .eq('id', id);
        } else {
            // 휴지통 이동 (Soft Delete)
            result = await supabaseAdmin
                .from('posts')
                .update({ status: 'trash' })
                .eq('id', id);
        }

        if (result.error) throw result.error;

        return NextResponse.json({
            message: force ? 'Permanently deleted' : 'Moved to trash'
        });
    } catch (error: any) { // 'any' is used because supabase error might not be standard Error
        const message = error.message || '서버 오류가 발생했습니다.';
        // 제약조건 에러 힌트 추가
        if (message.includes('posts_status_check')) {
            return NextResponse.json({ message: 'DB 스키마가 업데이트되지 않았습니다. 휴지통 기능을 위해 posts_status_check 제약조건을 수정해주세요.' }, { status: 500 });
        }
        return NextResponse.json({ message }, { status: 500 });
    }
}
