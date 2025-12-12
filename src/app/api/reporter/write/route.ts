import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/reporter/write
 * 새 기사 작성
 */
export async function POST(req: NextRequest) {
    try {
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

        const body = await req.json();
        const { title, content, category, thumbnail_url, status = 'draft' } = body;

        // 필수 필드 검증
        if (!title || !content) {
            return NextResponse.json(
                { message: '제목과 내용은 필수입니다.' },
                { status: 400 }
            );
        }

        // 기사 생성
        const { data: post, error: postError } = await supabaseAdmin
            .from('posts')
            .insert([{
                title,
                content,
                category: category || '전남',
                source: reporter.region,
                thumbnail_url: thumbnail_url || null,
                status: status, // draft, pending, published
                author_id: reporter.id,
                published_at: new Date().toISOString(),
                original_url: null, // 직접 작성한 기사는 원본 URL 없음
            }])
            .select()
            .single();

        if (postError) {
            console.error('Post creation error:', postError);
            return NextResponse.json(
                { message: '기사 작성에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: '기사가 작성되었습니다.',
            post,
        });

    } catch (error: unknown) {
        console.error('Write article error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
