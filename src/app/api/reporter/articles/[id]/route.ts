import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * 기사 편집 권한 확인
 */
function canEditArticle(
    reporter: { id: string; region: string; access_level: number },
    article: { source: string; author_id: string | null }
): boolean {
    // 전체 총괄 (access_level 3)
    if (reporter.access_level >= 3) return true;
    // 지역 총괄 (access_level 2) - 내 지역만
    if (reporter.access_level >= 2 && article.source === reporter.region) return true;
    // 일반 기자 - 내 지역 또는 내가 쓴 기사
    if (article.source === reporter.region) return true;
    if (article.author_id === reporter.id) return true;
    return false;
}

/**
 * GET /api/reporter/articles/[id]
 * 특정 기사 조회
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 기사 조회
        const { data: article, error: articleError } = await supabaseAdmin
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (articleError || !article) {
            return NextResponse.json(
                { message: '기사를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 편집 권한 확인
        const canEdit = canEditArticle(reporter, article);

        // 편집 권한이 없고, 다른 지역이고, 승인되지 않은 기사는 접근 불가
        if (!canEdit && article.source !== reporter.region && article.status !== 'published') {
            return NextResponse.json(
                { message: '접근 권한이 없습니다.' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            article,
            canEdit,
            reporter: {
                id: reporter.id,
                region: reporter.region,
                access_level: reporter.access_level,
            },
        });

    } catch (error: unknown) {
        console.error('Get article error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * PUT /api/reporter/articles/[id]
 * 기사 수정
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 기존 기사 조회
        const { data: existingArticle, error: existingError } = await supabaseAdmin
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (existingError || !existingArticle) {
            return NextResponse.json(
                { message: '기사를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 편집 권한 확인
        if (!canEditArticle(reporter, existingArticle)) {
            return NextResponse.json(
                { message: '편집 권한이 없습니다.' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { title, content, category, thumbnail_url, status, author_id } = body;

        // 업데이트할 데이터
        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
        if (status !== undefined) updateData.status = status;

        // 기자 배정 로직
        // 1. 명시적 author_id 지정 (편집국장/지사장이 기자 지정)
        if (author_id !== undefined) {
            // 기자 지정 권한 확인 (access_level 2 이상: 지사장, 편집국장)
            if (reporter.access_level >= 2) {
                updateData.author_id = author_id;
            }
        }
        // 2. 승인(published)으로 변경 시 author_id가 없으면 현재 기자로 자동 배정
        else if (status === 'published' && !existingArticle.author_id) {
            updateData.author_id = reporter.id;
            updateData.published_at = new Date().toISOString();
        }

        // 기사 업데이트
        const { data: updatedArticle, error: updateError } = await supabaseAdmin
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Article update error:', updateError);
            return NextResponse.json(
                { message: '기사 수정에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: '기사가 수정되었습니다.',
            article: updatedArticle,
        });

    } catch (error: unknown) {
        console.error('Update article error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * DELETE /api/reporter/articles/[id]
 * 기사 삭제 (Soft Delete - status를 'trash'로 변경)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 기사 조회
        const { data: article, error: articleError } = await supabaseAdmin
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (articleError || !article) {
            return NextResponse.json(
                { message: '기사를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 삭제 권한 확인 (canEditArticle 재사용)
        if (!canEditArticle(reporter, article)) {
            return NextResponse.json(
                { message: '삭제 권한이 없습니다.' },
                { status: 403 }
            );
        }

        // Soft Delete: status를 'trash'로 변경
        const { error: deleteError } = await supabaseAdmin
            .from('posts')
            .update({ status: 'trash' })
            .eq('id', id);

        if (deleteError) {
            console.error('Article delete error:', deleteError);
            return NextResponse.json(
                { message: '기사 삭제에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: '기사가 삭제되었습니다.',
        });

    } catch (error: unknown) {
        console.error('Delete article error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

/**
 * PATCH /api/reporter/articles/[id]
 * 기자 변경 (author_id 업데이트)
 * 권한: access_level >= 2 (지사장 이상)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (reporterError || !reporter) {
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 기자 변경 권한 확인 (access_level >= 2: 지사장 이상)
        if (reporter.access_level < 2) {
            return NextResponse.json(
                { message: '기자 변경 권한이 없습니다. 지사장 이상의 권한이 필요합니다.' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { author_id } = body;

        if (!author_id) {
            return NextResponse.json(
                { message: '변경할 기자를 선택해주세요.' },
                { status: 400 }
            );
        }

        // 기사 조회
        const { data: article, error: articleError } = await supabaseAdmin
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (articleError || !article) {
            return NextResponse.json(
                { message: '기사를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 기자 변경
        const { data: updatedArticle, error: updateError } = await supabaseAdmin
            .from('posts')
            .update({ author_id })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Author change error:', updateError);
            return NextResponse.json(
                { message: '기자 변경에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: '기자가 변경되었습니다.',
            article: updatedArticle,
        });

    } catch (error: unknown) {
        console.error('Change author error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
