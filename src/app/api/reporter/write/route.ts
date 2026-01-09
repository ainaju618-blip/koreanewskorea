import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPositionLabel, getRegionCode } from '@/lib/reporter-utils';

/**
 * POST /api/reporter/write
 * 새 기사 작성
 */
export async function POST(req: NextRequest) {
    // === 디버깅: 환경변수 체크 ===
    console.log('[Write API] === START ===');
    console.log('[Write API] ENV check:', {
        SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    try {
        // Step 1: 인증 체크
        console.log('[Write API] Step 1: Auth check...');
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        console.log('[Write API] User result:', { userId: user?.id, error: userError?.message });

        if (userError || !user) {
            console.log('[Write API] Auth failed - returning 401');
            return NextResponse.json(
                { message: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // Step 2: 기자 정보 조회
        console.log('[Write API] Step 2: Fetching reporter...');
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', user.id)
            .single();

        console.log('[Write API] Reporter result:', {
            id: reporter?.id,
            name: reporter?.name,
            position: reporter?.position,
            region: reporter?.region,
            error: reporterError?.message
        });

        if (reporterError || !reporter) {
            console.log('[Write API] Reporter not found - returning 404');
            return NextResponse.json(
                { message: '기자 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // Step 3: 요청 본문 파싱
        console.log('[Write API] Step 3: Parsing body...');
        const body = await req.json();
        console.log('[Write API] Body:', {
            title: body.title?.substring(0, 30),
            status: body.status,
            category: body.category,
            hasContent: !!body.content,
            hasThumbnail: !!body.thumbnail_url,
        });

        const { title, subtitle, content, category, thumbnail_url, status: rawStatus = 'draft' } = body;

        // Step 4: 필수 필드 검증
        console.log('[Write API] Step 4: Validation...');
        if (!title || !content) {
            console.log('[Write API] Validation failed - returning 400');
            return NextResponse.json(
                { message: '제목과 내용은 필수입니다.' },
                { status: 400 }
            );
        }

        // Step 5: Status 매핑
        console.log('[Write API] Step 5: Status mapping...');
        const statusMap: Record<string, string> = {
            draft: 'draft',
            pending: 'review',
            published: 'published',
        };
        const status = statusMap[rawStatus] || 'draft';
        console.log('[Write API] Status mapped:', { rawStatus, mappedStatus: status });

        // Step 6: Region 매핑 (공통 모듈 사용)
        console.log('[Write API] Step 6: Region mapping...');
        const regionCode = getRegionCode(reporter.region);
        console.log('[Write API] Region:', { original: reporter.region, mapped: regionCode });

        // Step 7: 직위 레이블 (임시 우회 가능)
        console.log('[Write API] Step 7: Position label...');
        let positionLabel: string;
        try {
            positionLabel = reporter.position ? getPositionLabel(reporter.position) : '기자';
            console.log('[Write API] getPositionLabel success:', positionLabel);
        } catch (posErr) {
            console.error('[Write API] getPositionLabel ERROR:', posErr);
            positionLabel = '기자'; // 폴백
        }
        const authorName = `${reporter.name} ${positionLabel}`;
        console.log('[Write API] Author name:', authorName);

        // Step 8: original_link 생성
        console.log('[Write API] Step 8: Generate original_link...');
        const timestamp = Date.now();
        const originalLink = `reporter://${reporter.id}/${timestamp}`;
        console.log('[Write API] original_link:', originalLink);

        // Step 9: DB Insert
        console.log('[Write API] Step 9: Inserting to DB...');
        const insertData = {
            title,
            subtitle: subtitle || null,
            content,
            category: category || '전남',
            source: reporter.region,
            region: regionCode,
            thumbnail_url: thumbnail_url || null,
            status: status,
            author_id: reporter.user_id,  // profiles 테이블 FK (reporter.id → reporter.user_id)
            author_name: authorName,
            original_link: originalLink,
            published_at: new Date().toISOString(),
        };
        console.log('[Write API] Insert data keys:', Object.keys(insertData));

        const { data: post, error: postError } = await supabaseAdmin
            .from('posts')
            .insert([insertData])
            .select()
            .single();

        // Step 10: 결과 처리
        console.log('[Write API] Step 10: Processing result...');
        if (postError) {
            console.error('[Write API] POST ERROR:', JSON.stringify(postError, null, 2));
            return NextResponse.json(
                {
                    message: '기사 작성에 실패했습니다.',
                    error: postError.message,
                    details: postError.details,
                    hint: postError.hint,
                    code: postError.code,
                },
                { status: 500 }
            );
        }

        console.log('[Write API] === SUCCESS === Post ID:', post?.id);
        return NextResponse.json({
            message: '기사가 작성되었습니다.',
            post,
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('[Write API] === UNHANDLED ERROR ===');
        console.error('[Write API] Error type:', typeof error);
        console.error('[Write API] Error:', error);

        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        const stack = error instanceof Error ? error.stack : undefined;

        return NextResponse.json({
            message,
            error: String(error),
            stack: process.env.NODE_ENV === 'development' ? stack : undefined
        }, { status: 500 });
    }
}
