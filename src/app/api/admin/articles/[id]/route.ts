import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { POSITION_LABELS } from '@/lib/reporter-utils';

// 카테고리 → source 매핑
const categorySourceMap: Record<string, string> = {
  government: '나주시',
  council: '나주시의회',
  education: '나주교육지원청',
  fire: '나주소방서',
  business: '나주상공회의소',
  opinion: '코리아뉴스 나주',
};

/**
 * GET /api/admin/articles/[id]
 * 기사 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: article, error } = await supabaseAdmin
      .from('posts')
      .select('id, title, subtitle, content, category, source, thumbnail_url, author_name, author_id, status, view_count, created_at, published_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !article) {
      return NextResponse.json(
        { error: '기사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Article get error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/articles/[id]
 * 기사 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      subtitle,
      content,
      category,
      thumbnail_url,
      reporter_id,
      status,
    } = body;

    // 필수 필드 검증
    if (!title?.trim()) {
      return NextResponse.json(
        { error: '제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: '본문을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 기존 기사 확인
    const { data: existing } = await supabaseAdmin
      .from('posts')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: '기사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본문 줄바꿈 처리
    const processedContent = content
      .split(/\n\n+/)
      .map((p: string) => p.trim())
      .filter((p: string) => p)
      .map((p: string) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');

    // source 결정
    const source = category ? (categorySourceMap[category] || '코리아뉴스 나주') : undefined;

    const updateData: any = {
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      content: processedContent,
      updated_at: new Date().toISOString(),
    };

    if (category) {
      updateData.category = category;
      updateData.source = source;
    }

    if (thumbnail_url !== undefined) {
      updateData.thumbnail_url = thumbnail_url || null;
    }

    if (reporter_id) {
      // 기자 정보 조회 (직위 포함)
      const { data: reporter } = await supabaseAdmin
        .from('reporters')
        .select('id, name, user_id, position')
        .eq('id', reporter_id)
        .single();

      if (reporter) {
        // 직위 한글 변환 (예: national_chief_director → 전국총괄본부장)
        const positionLabel = reporter.position
          ? POSITION_LABELS[reporter.position] || '기자'
          : '기자';
        updateData.author_name = `${reporter.name} ${positionLabel}`;
        updateData.author_id = reporter.user_id || null;
      }
    }

    if (status) {
      updateData.status = status;
      // 처음 게시하는 경우
      if (status === 'published' && existing.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: article, error } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Article update error:', error);
      return NextResponse.json(
        { error: '기사 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      article,
      message: '기사가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Article update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/articles/[id]
 * 기사 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Article delete error:', error);
      return NextResponse.json(
        { error: '기사 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '기사가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Article delete error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
