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
        const { title, content, category, thumbnail_url, status } = body;

        // 업데이트할 데이터
        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
        if (status !== undefined) updateData.status = status;

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
