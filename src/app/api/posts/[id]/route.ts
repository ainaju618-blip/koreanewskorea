
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v2 as cloudinary } from 'cloudinary';
import { autoAssignReporter, getAutoAssignSetting, type AssignResult } from '@/lib/auto-assign';

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Next.js 16+ 동적 라우트 타입 정의
interface RouteParams {
    params: Promise<{ id: string }>;
}

// UPDATE
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();

        let assignResult: AssignResult | null = null;

        // [Touch-to-Top Logic + Auto-assign Reporter]
        // When status changes to 'published':
        // 1. Set published_at to now (for latest-first sorting)
        // 2. Auto-assign reporter if enabled and no author specified
        if (body.status === 'published') {
            const now = new Date().toISOString();
            body.published_at = now;
            body.approved_at = now;

            // Check if auto-assign is enabled and author not already specified
            const shouldAutoAssign = !body.author_id && !body.skip_auto_assign;

            if (shouldAutoAssign) {
                try {
                    const autoAssignEnabled = await getAutoAssignSetting();

                    if (autoAssignEnabled) {
                        // Get article's region for assignment
                        const { data: article } = await supabaseAdmin
                            .from('posts')
                            .select('region')
                            .eq('id', id)
                            .single();

                        const articleRegion = body.region || article?.region || null;

                        // Auto-assign reporter
                        assignResult = await autoAssignReporter(articleRegion);

                        // Set author info
                        body.author_id = assignResult.reporter.id;
                        body.author_name = assignResult.reporter.name;

                        console.log('[PATCH /api/posts] Auto-assigned:', {
                            reporter: assignResult.reporter.name,
                            reason: assignResult.reason,
                            region: articleRegion,
                        });
                    }
                } catch (assignError) {
                    console.warn('[PATCH /api/posts] Auto-assign failed:', assignError);
                    // Continue without auto-assign - don't block the approval
                }
            }
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

        // Include assignment info in response
        return NextResponse.json({
            ...data,
            _assignment: assignResult ? {
                reporter: assignResult.reporter.name,
                reason: assignResult.reason,
                message: assignResult.message,
            } : null,
        });
    } catch (error: unknown) {
        console.error('[PATCH /api/posts] Catch Error:', error);
        // Handle both Error instances and Supabase error objects
        let message = 'Server error occurred';
        if (error instanceof Error) {
            message = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            message = String((error as { message: unknown }).message);
        }
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

            // 이미지 삭제
            if (post?.thumbnail_url) {
                try {
                    if (post.thumbnail_url.startsWith('/images/')) {
                        // 로컬 이미지 삭제
                        const fs = await import('fs');
                        const path = await import('path');
                        const filePath = path.join(process.cwd(), 'public', post.thumbnail_url);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`[로컬 이미지 삭제] ${post.thumbnail_url}`);
                        }
                    } else if (post.thumbnail_url.includes('cloudinary.com')) {
                        // Cloudinary 이미지 삭제
                        // URL에서 public_id 추출: https://res.cloudinary.com/xxx/image/upload/v123/folder/filename.webp
                        const urlParts = post.thumbnail_url.split('/upload/');
                        if (urlParts[1]) {
                            // v123/folder/filename.webp -> folder/filename (확장자와 버전 제거)
                            const pathPart = urlParts[1].replace(/^v\d+\//, ''); // 버전 제거
                            const publicId = pathPart.replace(/\.[^.]+$/, ''); // 확장자 제거
                            await cloudinary.uploader.destroy(publicId);
                            console.log(`[Cloudinary 이미지 삭제] ${publicId}`);
                        }
                    }
                } catch (imgError) {
                    console.warn('[이미지 삭제 실패]', imgError);
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
