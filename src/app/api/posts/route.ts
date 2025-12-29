import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { autoAssignReporter, getAutoAssignSetting } from '@/lib/auto-assign';

// GET /api/posts - 기사 목록 조회
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        // Page & Limit (Default: Page 1, Limit 20)
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const requireImage = searchParams.get('requireImage') === 'true'; // ★ 이미지 필수 여부

        const sort = searchParams.get('sort') || 'published_at';
        const sortField = sort === 'created_at' ? 'created_at' : 'published_at';
        const category = searchParams.get('category'); // ★ 카테고리 필터
        const region = searchParams.get('region'); // ★ 지역 필터

        // Calculate Range
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact' }) // Get total count
            .order(sortField, { ascending: false })
            .range(start, end);

        // 상태 필터
        // - 'published': 메인 노출 가능 (이미지+본문+제목)
        // - 'draft': 게시판만 노출 (본문+제목)
        // - 'hidden': 어디에도 안 나옴 (제목만)
        // - 'visible': published + draft (게시판에서 사용)
        if (status === 'visible') {
            // 게시판용: published 또는 draft 상태의 기사
            query = query.in('status', ['published', 'draft']);
        } else if (status && status !== 'all') {
            query = query.eq('status', status);
        } else {
            // 기본값: hidden 제외 (published + draft)
            query = query.neq('status', 'hidden');
        }

        // ★ 이미지 필수 필터 (메인 페이지용)
        if (requireImage) {
            query = query
                .not('thumbnail_url', 'is', null)  // null 제외
                .neq('thumbnail_url', '')          // 빈 문자열 제외
                .like('thumbnail_url', 'http%');   // http로 시작하는 URL만
        }

        // ★ 카테고리 필터 (관리자 GNB 메뉴용)
        if (category) {
            query = query.eq('category', category);
        }

        // ★ 지역 필터 (시군별 보도자료 페이지용)
        if (region) {
            query = query.eq('region', region);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            posts: data,
            count: count || 0,
            page,
            totalPages: count ? Math.ceil(count / limit) : 0
        });
    } catch (error: any) {
        console.error('GET /api/posts error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/posts - 기사 생성 (봇 또는 관리자 직접 작성용)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('posts')
            .insert({
                title: body.title,
                content: body.content,
                status: body.status || 'draft',
                category: body.category,
                source: body.source,
                original_link: body.original_link,
                thumbnail_url: body.thumbnail_url,
                published_at: body.published_at || new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/posts error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PATCH /api/posts - Bulk update (approve, hold, etc.)
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids, status: newStatus, action } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs array required' }, { status: 400 });
        }

        console.log(`[PATCH /api/posts] Bulk update: ${ids.length} items, status=${newStatus}, action=${action}`);

        const now = new Date().toISOString();
        let updateData: Record<string, any> = {};

        // Determine update data based on action/status
        if (newStatus === 'published' || action === 'approve') {
            updateData = {
                status: 'published',
                published_at: now,
                approved_at: now,
                site_published_at: now, // Site publish time
            };

            // Check if auto-assign is enabled
            const autoAssignEnabled = await getAutoAssignSetting();

            if (autoAssignEnabled) {
                // Get articles to find their regions
                const { data: articles } = await supabaseAdmin
                    .from('posts')
                    .select('id, region, author_id, author_name')
                    .in('id', ids);

                if (articles && articles.length > 0) {
                    // Process auto-assign for each article that needs it
                    const updates = await Promise.all(
                        articles.map(async (article) => {
                            // Skip if already has author
                            if (article.author_id || article.author_name) {
                                return { id: article.id, ...updateData };
                            }

                            try {
                                const assignResult = await autoAssignReporter(article.region);

                                // Verify profile exists before setting author_id
                                let authorId = null;
                                if (assignResult.reporter.user_id) {
                                    const { data: profile } = await supabaseAdmin
                                        .from('profiles')
                                        .select('id')
                                        .eq('id', assignResult.reporter.user_id)
                                        .single();
                                    if (profile) {
                                        authorId = assignResult.reporter.user_id;
                                    }
                                }

                                return {
                                    id: article.id,
                                    ...updateData,
                                    author_name: assignResult.reporter.name,
                                    ...(authorId ? { author_id: authorId } : {}),
                                };
                            } catch {
                                return { id: article.id, ...updateData };
                            }
                        })
                    );

                    // Update each article with its specific data
                    let successCount = 0;
                    let failCount = 0;

                    await Promise.all(
                        updates.map(async (update) => {
                            const { id, ...data } = update;
                            const { error } = await supabaseAdmin
                                .from('posts')
                                .update(data)
                                .eq('id', id);
                            if (error) {
                                console.error(`[Bulk approve] Failed for ${id}:`, error.message);
                                failCount++;
                            } else {
                                successCount++;
                            }
                        })
                    );

                    return NextResponse.json({
                        message: `${successCount} approved, ${failCount} failed`,
                        success: successCount,
                        failed: failCount,
                    });
                }
            }
        } else if (newStatus === 'draft' || action === 'hold') {
            updateData = { status: 'draft' };
        } else if (newStatus === 'trash' || action === 'trash') {
            updateData = { status: 'trash' };
        } else if (newStatus) {
            updateData = { status: newStatus };
        }

        // Simple bulk update (no auto-assign needed)
        const { data, error, count } = await supabaseAdmin
            .from('posts')
            .update(updateData)
            .in('id', ids)
            .select('id');

        if (error) throw error;

        console.log(`[PATCH /api/posts] Bulk updated ${count || data?.length || 0} items`);

        return NextResponse.json({
            message: `${count || data?.length || 0} items updated`,
            success: count || data?.length || 0,
            failed: 0,
        });
    } catch (error: any) {
        console.error('PATCH /api/posts error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE /api/posts - Bulk delete (soft or hard)
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true';

        // Body 파싱 (에러 처리 강화)
        let ids: string[] = [];
        try {
            const body = await req.json();
            ids = body.ids || [];
        } catch (parseError) {
            console.error('[DELETE /api/posts] Body parse error:', parseError);
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs array required' }, { status: 400 });
        }

        console.log(`[DELETE /api/posts] Bulk delete: ${ids.length} items, force=${force}`);

        let result;
        if (force) {
            // Hard delete
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
            console.error('[DELETE /api/posts] Supabase error:', result.error);
            throw result.error;
        }

        return NextResponse.json({
            message: `${ids.length} items ${force ? 'permanently deleted' : 'moved to trash'}`,
            success: ids.length,
            failed: 0,
        });
    } catch (error: any) {
        console.error('DELETE /api/posts error:', error);
        return NextResponse.json({ message: error.message || 'Delete failed' }, { status: 500 });
    }
}
