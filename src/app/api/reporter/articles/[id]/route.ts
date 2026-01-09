import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { recordArticleHistory, createNotification, generateChangeSummary } from '@/lib/article-history';
import { isSameRegion } from '@/lib/reporter-utils';

/**
 * 기사 편집 권한 확인
 * @param reporter - 기자 정보 (user_id: profiles FK, id: reporters PK)
 * @param article - 기사 정보 (author_id: profiles FK = reporter.user_id)
 *
 * 권한 우선순위:
 * 1. 전체 총괄 (access_level 3) → 모든 기사
 * 2. 지역 총괄 (access_level 2) → 같은 지역 기사
 * 3. 같은 지역 소속 기자 → 같은 지역 기사
 * 4. 본인이 작성한 기사
 */
function canEditArticle(
    reporter: { id: string; user_id: string | null; region: string; access_level: number },
    article: { source: string | null; region?: string | null; author_id: string | null }
): boolean {
    // 전체 총괄 (access_level 3)
    if (reporter.access_level >= 3) return true;

    // 같은 지역인지 확인 (source 또는 region 코드로 비교)
    const sameRegion = isSameRegion(reporter.region, article.source, article.region);

    // 지역 총괄 (access_level 2) - 내 지역만
    if (reporter.access_level >= 2 && sameRegion) return true;

    // 일반 기자 - 내 지역 기사는 편집/삭제 가능
    if (sameRegion) return true;

    // author_id는 profiles FK (reporter.user_id)로 저장되므로 user_id와 비교
    if (reporter.user_id && article.author_id === reporter.user_id) return true;

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
        const { title, subtitle, content, category, thumbnail_url, status, author_id, rejection_reason } = body;

        // Determine action type
        let action: 'edited' | 'approved' | 'rejected' | 'status_changed' = 'edited';
        if (status === 'published' && existingArticle.status !== 'published') {
            action = 'approved';
        } else if (status === 'rejected') {
            action = 'rejected';
        } else if (status !== undefined && status !== existingArticle.status) {
            action = 'status_changed';
        }

        // Build update data
        const updateData: Record<string, unknown> = {
            last_edited_by: reporter.id,
            last_edited_at: new Date().toISOString(),
        };
        if (title !== undefined) updateData.title = title;
        if (subtitle !== undefined) updateData.subtitle = subtitle;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
        if (status !== undefined) updateData.status = status;

        // Rejection reason
        if (status === 'rejected' && rejection_reason) {
            updateData.rejection_reason = rejection_reason;
        }

        // Author assignment logic
        // 1. Explicit author_id (editor/branch manager assigns reporter)
        if (author_id !== undefined) {
            if (reporter.access_level >= 2) {
                updateData.author_id = author_id;
            }
        }
        // 2. Auto-assign on publish if no author
        else if (status === 'published' && !existingArticle.author_id) {
            updateData.author_id = reporter.id;
            updateData.published_at = new Date().toISOString();
        }

        // Update article
        const { data: updatedArticle, error: updateError } = await supabaseAdmin
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Article update error:', updateError);
            return NextResponse.json(
                { message: 'Failed to update article' },
                { status: 500 }
            );
        }

        // Record history
        const changeSummary = generateChangeSummary(existingArticle, { title, content, status });
        await recordArticleHistory({
            article_id: id,
            editor_id: reporter.id,
            editor_name: reporter.name,
            action,
            previous_title: existingArticle.title,
            previous_content: existingArticle.content,
            previous_status: existingArticle.status,
            new_title: title,
            new_content: content,
            new_status: status,
            change_summary: changeSummary,
        });

        // Send notifications
        if (existingArticle.author_id && existingArticle.author_id !== reporter.id) {
            if (action === 'approved') {
                await createNotification({
                    recipient_id: existingArticle.author_id,
                    type: 'article_approved',
                    title: 'Article approved',
                    message: `Your article "${existingArticle.title}" has been approved`,
                    article_id: id,
                    actor_id: reporter.id,
                    actor_name: reporter.name,
                });
            } else if (action === 'rejected') {
                await createNotification({
                    recipient_id: existingArticle.author_id,
                    type: 'article_rejected',
                    title: 'Article rejected',
                    message: rejection_reason || `Your article "${existingArticle.title}" has been rejected`,
                    article_id: id,
                    actor_id: reporter.id,
                    actor_name: reporter.name,
                });
            }
        }

        return NextResponse.json({
            message: 'Article updated',
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

        // Get new author info
        const { data: newAuthor } = await supabaseAdmin
            .from('reporters')
            .select('id, name')
            .eq('id', author_id)
            .single();

        // Change author
        const { data: updatedArticle, error: updateError } = await supabaseAdmin
            .from('posts')
            .update({ author_id })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Author change error:', updateError);
            return NextResponse.json(
                { message: 'Failed to change author' },
                { status: 500 }
            );
        }

        // Record history
        await recordArticleHistory({
            article_id: id,
            editor_id: reporter.id,
            editor_name: reporter.name,
            action: 'assigned',
            change_summary: `Assigned to ${newAuthor?.name || 'unknown'}`,
        });

        // Notify new author
        if (newAuthor && newAuthor.id !== reporter.id) {
            await createNotification({
                recipient_id: newAuthor.id,
                type: 'article_assigned',
                title: 'Article assigned',
                message: `"${article.title}" has been assigned to you`,
                article_id: id,
                actor_id: reporter.id,
                actor_name: reporter.name,
            });
        }

        return NextResponse.json({
            message: 'Author changed',
            article: updatedArticle,
        });

    } catch (error: unknown) {
        console.error('Change author error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
